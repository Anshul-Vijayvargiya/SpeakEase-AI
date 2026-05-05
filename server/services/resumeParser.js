import { createRequire } from 'module';
import OpenAI from 'openai';
const require = createRequire(import.meta.url);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

export const extractTextFromPDF = async (buffer) => {
  try {
    if (!buffer) {
      console.log("❌ No buffer received");
      return '';
    }

    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      console.log("❌ Empty PDF text");
      return '';
    }

    console.log("✅ PDF parsed successfully");

    return data.text;

  } catch (err) {
    console.error('❌ PDF parse error:', err.message);
    return '';
  }
};

export const extractTextFromDOCX = async (buffer) => {
  try {
    if (!buffer) return '';
    const result = await mammoth.extractRawText({ buffer });
    console.log("✅ DOCX parsed successfully");
    return result.value;
  } catch (err) {
    console.error('❌ DOCX parse error:', err.message);
    return '';
  }
};

export const extractText = async (buffer, fileName = '') => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'docx') {
    return await extractTextFromDOCX(buffer);
  } else {
    // Default to PDF
    return await extractTextFromPDF(buffer);
  }
};

export const parseResume = async (filePath, mimetype) => {
  let text = "";

  // Extract raw text based on file type
  if (mimetype === "application/pdf") {
    const pdfParse = require("pdf-parse");
    const dataBuffer = require("fs").readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    text = pdfData.text;
  } else {
    const mammoth = require("mammoth");
    const result  = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  }

  if (!text || text.trim().length < 50) {
    throw new Error("Could not extract text from resume");
  }

  // Send to GPT with detailed extraction prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "system",
      content: "You are a resume parser. Extract all information accurately. Return ONLY valid JSON, no markdown, no extra text."
    }, {
      role: "user",
      content: `
        Extract ALL of the following from this resume.
        Look carefully for projects, internships, and experience sections.
        If a field is not found, return empty array [] not null.

        Return this exact JSON structure:
        {
          "name": "full name",
          "email": "email if found",
          "phone": "phone if found",
          "skills": ["skill1", "skill2"],
          "techStack": ["tech1", "tech2"],
          "projects": [
            {
              "name": "project name",
              "description": "what it does in 1-2 sentences",
              "technologies": ["tech1", "tech2"],
              "highlights": ["key feature 1", "key feature 2"]
            }
          ],
          "experience": [
            {
              "company": "company name",
              "role": "job title",
              "duration": "duration eg Jan 2023 - Mar 2023",
              "responsibilities": ["task1", "task2"]
            }
          ],
          "education": [
            {
              "degree": "B.Tech / MCA etc",
              "institution": "college name",
              "year": "graduation year",
              "cgpa": "cgpa if mentioned"
            }
          ],
          "certifications": ["cert1", "cert2"],
          "achievements": ["achievement1", "achievement2"]
        }

        Resume text:
        ${text}
      `
    }],
    temperature: 0.1,
    max_tokens: 2000,
  });

  const raw   = response.choices[0].message.content;
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("GPT returned invalid JSON for resume parsing");
  }
};