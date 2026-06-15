import axios from 'axios';
import User from '../models/User.js';
import { analyzeResume } from '../services/aiService.js';
import { generateQuestions } from '../services/questionGenerator.js';
import { extractText } from '../services/resumeParser.js';
import { extractJSON } from '../utils/jsonHelper.js';

const performAIParsing = async (resumeText) => {
    const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!openRouterKey) {
        throw new Error("No API key for resume parsing");
    }

    const prompt = `You are an expert technical recruiter and resume parser.
Extract information from the resume text and return ONLY a valid JSON object.
Extract: 
- name
- role
- experienceLevel (Beginner/Intermediate/Advanced)
- summary
- skills (array of strings)
- techStack (array of strings)
- projects (array of objects with title, description, technologies)
- experience (array of objects with company, role, duration, description)
- education (array of objects with institution, degree, year)
- certifications (array of strings)

Resume Text: ${resumeText.substring(0, 6000)}
Return strictly valid JSON.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: "openai/gpt-4o-mini",
        messages: [{ role: 'user', content: prompt + ' Format as JSON.' }],
        response_format: { type: "json_object" },
        max_tokens: 2000
    }, {
        headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'SpeakEase AI'
        },
        timeout: 30000
    });

    let responseText = response.data.choices[0].message.content.trim();
    return extractJSON(responseText);
};

export const uploadResume = async (req, res) => {
    console.log('[Resume Controller] uploadResume hit');
    try {
        const { resume, fileName, interviewType } = req.body;
        
        if (!resume) {
            return res.status(400).json({ error: 'No resume provided' });
        }

        const buffer = Buffer.from(resume, 'base64');
        console.log('[Resume Controller] Buffer created, size:', buffer.length);
        
        const resumeText = await extractText(buffer, fileName);
        console.log('[Resume Controller] Text extracted, length:', resumeText.length);

        if (resumeText.length < 50) {
            console.warn('[Resume Controller] Very short text extracted, possibly a scanned file or parsing issue');
        }

        // 1. Parse Resume Data with AI
        let parsedData = {
            role: 'Software Engineer',
            experienceLevel: 'Junior',
            skills: []
        };

        try {
            parsedData = await performAIParsing(resumeText);
            console.log('[Resume Controller] AI parsing successful for:', parsedData.name || 'Unknown');
        } catch (aiErr) {
            console.error('[Resume Controller] AI parsing failed:', aiErr.message);
            // Continue with defaults so the user doesn't get stuck, 
            // but generateQuestions might still fail if it's a key issue
        }

        // 2. Generate Questions and Analysis
        console.log('[Resume Controller] Generating questions and analysis for type:', interviewType);
        
        let questions = [];
        let analysis = null;

        try {
            questions = await generateQuestions({
                resumeText,
                targetRole: parsedData.role,
                experienceLevel: parsedData.experienceLevel,
                interviewMode: interviewType
            });
        } catch (qErr) {
            console.error('[Resume Controller] Question generation failed:', qErr.message);
            // Final fallback to ensure the user isn't blocked
            questions = [
                { id: 1, category: "General", difficulty: "Medium", question: "Tell me about your most significant project.", whyAsked: "General introductory question.", expectedPoints: ["Role", "Impact", "Tech used"] },
                { id: 2, category: "General", difficulty: "Medium", question: "What is your preferred tech stack and why?", whyAsked: "Assessing technical preference.", expectedPoints: ["Rationale", "Experience", "Pros/Cons"] }
            ];
        }

        try {
            analysis = await analyzeResume(resumeText, parsedData.role);
        } catch (aErr) {
            console.error('[Resume Controller] Resume analysis failed:', aErr.message);
            // analysis remains null or gets a fallback from the service
        }
        
        // 3. Save to User context
        if (req.user) {
            const updateFields = { 
                resumeData: parsedData,
                resumeText: resumeText.substring(0, 2000)
            };
            if (analysis) updateFields.resumeAnalysis = analysis;
            
            await User.findByIdAndUpdate(req.user._id, updateFields);
        }

        res.status(200).json({
            parsedData,
            questions: questions || [],
            analysis: analysis || { 
                score: 70, 
                summary: "Analysis currently unavailable.", 
                strengths: ["Parsing successful"], 
                improvements: ["Try re-uploading for full AI review"],
                missingKeywords: [],
                formattingTips: []
            },
            resumeText: resumeText.substring(0, 2000)
        });

    } catch (error) {
        console.error('Upload & Generate Error:', error);
        res.status(500).json({ error: 'Failed to process resume and generate questions: ' + error.message });
    }
};

export const parseResume = async (req, res) => {
    try {
        const { resume } = req.body;
        if (!resume) return res.status(400).json({ error: 'No resume provided' });

        const buffer = Buffer.from(resume, 'base64');
        const resumeText = await extractText(buffer);
        const parsedData = await performAIParsing(resumeText);

        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { 
                resumeData: parsedData,
                resumeText: resumeText.substring(0, 2000)
            });
        }

        res.status(200).json({
            ...parsedData,
            extracted: true,
            message: 'Resume parsed successfully'
        });

    } catch (error) {
        console.error("[Resume Parser] Fatal error:", error.message);
        res.status(200).json({
            fallback: true,
            message: 'AI parser error. Please enter details manually.',
            extracted: false
        });
    }
};