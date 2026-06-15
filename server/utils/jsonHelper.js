/**
 * Cleans markdown code block wrapper backticks from raw text.
 * @param {string} raw
 * @returns {string}
 */
export const cleanJson = (raw) => {
  if (typeof raw !== 'string') {
    return String(raw || '').trim();
  }
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }
  return text.trim();
};

/**
 * Repairs common JSON formatting bugs (single quotes, trailing commas, raw control characters inside strings).
 * @param {string} str
 * @returns {string}
 */
const repairJSON = (str) => {
  let result = '';
  let i = 0;
  while (i < str.length) {
    const char = str[i];
    if (char === '"') {
      result += '"';
      i++;
      while (i < str.length) {
        const c = str[i];
        if (c === '\\') {
          result += '\\' + (str[i + 1] || '');
          i += 2;
        } else if (c === '"') {
          result += '"';
          i++;
          break;
        } else if (c === '\n') {
          result += '\\n';
          i++;
        } else if (c === '\r') {
          result += '\\r';
          i++;
        } else if (c === '\t') {
          result += '\\t';
          i++;
        } else {
          result += c;
          i++;
        }
      }
    } else if (char === "'") {
      let content = '';
      i++;
      while (i < str.length) {
        const c = str[i];
        if (c === '\\') {
          const next = str[i + 1] || '';
          if (next === "'") {
            content += "'";
          } else {
            content += '\\' + next;
          }
          i += 2;
        } else if (c === "'") {
          i++;
          break;
        } else if (c === '\n') {
          content += '\\n';
          i++;
        } else if (c === '\r') {
          content += '\\r';
          i++;
        } else if (c === '\t') {
          content += '\\t';
          i++;
        } else if (c === '"') {
          content += '\\"';
          i++;
        } else {
          content += c;
          i++;
        }
      }
      result += `"${content}"`;
    } else {
      result += char;
      i++;
    }
  }
  return result.replace(/,\s*([}\]])/g, '$1');
};

/**
 * Tokenizes a JSON string into basic tokens.
 * @param {string} str
 * @returns {Array<object>}
 */
const tokenize = (str) => {
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    while (i < str.length && /\s/.test(str[i])) {
      i++;
    }
    if (i >= str.length) break;

    const char = str[i];
    if (char === '{' || char === '}' || char === '[' || char === ']' || char === ':' || char === ',') {
      tokens.push({ type: char, value: char, start: i, end: i + 1 });
      i++;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      const start = i;
      i++;
      let value = '';
      let escaped = false;
      let completed = false;
      while (i < str.length) {
        const c = str[i];
        if (escaped) {
          value += c;
          escaped = false;
          i++;
        } else if (c === '\\') {
          escaped = true;
          i++;
        } else if (c === quote) {
          completed = true;
          i++;
          break;
        } else {
          value += c;
          i++;
        }
      }
      tokens.push({ type: 'STRING', value, start, end: i, completed });
      continue;
    }

    const start = i;
    let valStr = '';
    while (i < str.length && /[a-zA-Z0-9.+-]/.test(str[i])) {
      valStr += str[i];
      i++;
    }
    if (valStr) {
      let type = 'LITERAL';
      if (/^[0-9.+-]+$/.test(valStr)) {
        type = 'NUMBER';
      }
      tokens.push({ type, value: valStr, start, end: i, completed: true });
    } else {
      tokens.push({ type: 'UNKNOWN', value: char, start, end: i + 1 });
      i++;
    }
  }
  return tokens;
};

/**
 * Parses JSON tokens recursively, repairing truncation by closing objects/arrays and discarding partial keys.
 * @param {Array<object>} tokens
 * @returns {{value: any, completed: boolean}}
 */
const parseTokens = (tokens) => {
  let tIndex = 0;

  const parseValue = () => {
    if (tIndex >= tokens.length) {
      return { value: undefined, completed: false };
    }

    const tok = tokens[tIndex];

    if (tok.type === '{') {
      tIndex++;
      const obj = {};
      
      while (tIndex < tokens.length) {
        let nextTok = tokens[tIndex];
        if (nextTok.type === '}') {
          tIndex++;
          return { value: obj, completed: true };
        }

        if (nextTok.type !== 'STRING' && nextTok.type !== 'LITERAL') {
          return { value: obj, completed: false };
        }
        if (nextTok.type === 'STRING' && !nextTok.completed) {
          return { value: obj, completed: false };
        }

        const key = nextTok.value;
        tIndex++;

        if (tIndex >= tokens.length || tokens[tIndex].type !== ':') {
          return { value: obj, completed: false };
        }
        tIndex++;

        const valRes = parseValue();
        if (valRes.value !== undefined) {
          obj[key] = valRes.value;
        }
        if (!valRes.completed) {
          return { value: obj, completed: false };
        }

        if (tIndex >= tokens.length) {
          return { value: obj, completed: false };
        }
        const commaOrClose = tokens[tIndex];
        if (commaOrClose.type === '}') {
          tIndex++;
          return { value: obj, completed: true };
        } else if (commaOrClose.type === ',') {
          tIndex++;
        } else {
          return { value: obj, completed: false };
        }
      }
      return { value: obj, completed: false };
    }

    if (tok.type === '[') {
      tIndex++;
      const arr = [];

      while (tIndex < tokens.length) {
        let nextTok = tokens[tIndex];
        if (nextTok.type === ']') {
          tIndex++;
          return { value: arr, completed: true };
        }

        const valRes = parseValue();
        if (valRes.value !== undefined) {
          arr.push(valRes.value);
        }
        if (!valRes.completed) {
          return { value: arr, completed: false };
        }

        if (tIndex >= tokens.length) {
          return { value: arr, completed: false };
        }
        const commaOrClose = tokens[tIndex];
        if (commaOrClose.type === ']') {
          tIndex++;
          return { value: arr, completed: true };
        } else if (commaOrClose.type === ',') {
          tIndex++;
        } else {
          return { value: arr, completed: false };
        }
      }
      return { value: arr, completed: false };
    }

    if (tok.type === 'STRING') {
      tIndex++;
      return { value: tok.value, completed: tok.completed };
    }

    if (tok.type === 'NUMBER') {
      const num = Number(tok.value);
      tIndex++;
      return { value: isNaN(num) ? undefined : num, completed: true };
    }

    if (tok.type === 'LITERAL') {
      let val = undefined;
      if (tok.value === 'true') val = true;
      else if (tok.value === 'false') val = false;
      else if (tok.value === 'null') val = null;
      else {
        val = tok.value;
      }
      tIndex++;
      return { value: val, completed: true };
    }

    tIndex++;
    return { value: undefined, completed: false };
  };

  return parseValue();
};

/**
 * Extracts and parses JSON object or array from a string.
 * Supports truncated/incomplete JSON and conversational wrappers.
 * @param {string} raw
 * @param {any} [fallback] - Optional fallback value if parsing fails
 * @returns {any}
 */
export const extractJSON = (raw, fallback = undefined) => {
  if (typeof raw !== 'string') {
    if (fallback !== undefined) return fallback;
    throw new Error('Input must be a string');
  }

  const cleaned = cleanJson(raw);
  
  // 1. Try direct parsing
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // 2. Try parsing with repairs
  try {
    return JSON.parse(repairJSON(cleaned));
  } catch (_) {}

  // 3. Find boundaries of first JSON object or array
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIndex = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }
  
  if (startIndex !== -1) {
    const candidate = cleaned.slice(startIndex);
    try {
      const tokens = tokenize(candidate);
      const result = parseTokens(tokens);
      if (result.value !== undefined) {
        return result.value;
      }
    } catch (_) {}
  }
  
  console.error('[jsonHelper] Failed to parse JSON. Raw content preview:', raw.slice(0, 500));
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error('Could not parse JSON from AI response');
};
