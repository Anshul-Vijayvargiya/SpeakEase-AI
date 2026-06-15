import { test, describe } from 'node:test';
import assert from 'node:assert';
import { cleanJson, extractJSON } from '../utils/jsonHelper.js';

describe('JSON Helper - cleanJson', () => {
  test('should return empty string when input is null/undefined/non-string', () => {
    assert.strictEqual(cleanJson(null), '');
    assert.strictEqual(cleanJson(undefined), '');
    assert.strictEqual(cleanJson(123), '123');
    assert.strictEqual(cleanJson({}), '[object Object]');
  });

  test('should trim leading and trailing spaces', () => {
    assert.strictEqual(cleanJson('   {"a": 1}   '), '{"a": 1}');
  });

  test('should clean markdown json blocks', () => {
    const rawMarkdownJson = `\`\`\`json
    {
      "key": "value"
    }
\`\`\``;
    assert.strictEqual(cleanJson(rawMarkdownJson), '{\n      "key": "value"\n    }');
  });

  test('should clean markdown generic code blocks', () => {
    const rawMarkdown = `\`\`\`
    {
      "key": "value"
    }
\`\`\``;
    assert.strictEqual(cleanJson(rawMarkdown), '{\n      "key": "value"\n    }');
  });

  test('should not alter strings without code blocks', () => {
    const normalString = '{"key": "value"}';
    assert.strictEqual(cleanJson(normalString), normalString);
  });
});

describe('JSON Helper - extractJSON', () => {
  // 1. Direct Parsing
  test('should parse valid JSON directly', () => {
    const input = '{"name": "John", "age": 30, "skills": ["JS", "React"]}';
    const expected = { name: 'John', age: 30, skills: ['JS', 'React'] };
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  test('should parse valid JSON array directly', () => {
    const input = '[1, 2, "three", {"four": 4}]';
    const expected = [1, 2, 'three', { four: 4 }];
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  // 2. Parsed with Repairs
  test('should parse and repair trailing commas in objects', () => {
    const input = '{"name": "John", "age": 30,}';
    const expected = { name: 'John', age: 30 };
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  test('should parse and repair trailing commas in nested arrays and objects', () => {
    const input = '{"data": [1, 2, 3,], "nested": {"key": "val",},}';
    const expected = { data: [1, 2, 3], nested: { key: 'val' } };
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  test('should parse and repair single-quoted keys and values', () => {
    const input = "{'name': 'John', 'age': 30, 'skills': ['JS', 'React']}";
    const expected = { name: 'John', age: 30, skills: ['JS', 'React'] };
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  test('should parse and repair escaped single quotes inside single-quoted strings', () => {
    const input = "{'description': 'It\\'s a MERN stack application'}";
    const expected = { description: "It's a MERN stack application" };
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  test('should parse and repair raw newlines inside string values', () => {
    const input = '{"feedback": "Line 1\nLine 2\nLine 3"}';
    const result = extractJSON(input);
    assert.strictEqual(result.feedback, 'Line 1\nLine 2\nLine 3');
  });

  test('should parse and repair raw carriage returns and tabs inside string values', () => {
    const input = '{"formatting": "Value1\tValue2\rValue3"}';
    const result = extractJSON(input);
    assert.strictEqual(result.formatting, 'Value1\tValue2\rValue3');
  });

  test('should repair nested combinations of single quotes, trailing commas, and raw control characters', () => {
    const input = `{'list': [
      'item1',
      'item2',
    ], 'details': {
      'note': "nested 'quote' and \\"double\\" quote",
    },}`;
    const result = extractJSON(input);
    assert.deepStrictEqual(result.list, ['item1', 'item2']);
    assert.strictEqual(result.details.note, 'nested \'quote\' and "double" quote');
  });

  // 3. Extract JSON bounds from surrounding text
  test('should extract and parse JSON object from conversational wrapper text', () => {
    const input = 'Sure, here is the requested format: {"status": "success", "code": 200} Hope this helps!';
    const expected = { status: 'success', code: 200 };
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  test('should extract and parse JSON array from conversational wrapper text', () => {
    const input = 'Here are the items: [{"id": 1}, {"id": 2}] - let me know if you need more.';
    const expected = [{ id: 1 }, { id: 2 }];
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  test('should extract, repair, and parse JSON from conversational wrapper text', () => {
    const input = 'Here is your repaired data: {\'status\': \'success\', \'count\': 5,}';
    const expected = { status: 'success', count: 5 };
    assert.deepStrictEqual(extractJSON(input), expected);
  });

  // 4. Fallbacks & Errors
  test('should return fallback value if provided and parsing completely fails', () => {
    const input = 'This is just some text with no JSON in it whatsoever.';
    const fallback = { fallback: true };
    assert.deepStrictEqual(extractJSON(input, fallback), fallback);
  });

  test('should throw error when parsing completely fails and no fallback is provided', () => {
    const input = 'This is just some text with no JSON in it whatsoever.';
    assert.throws(() => {
      extractJSON(input);
    }, /Could not parse JSON from AI response/);
  });
});
