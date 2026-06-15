import axios from 'axios';
import { extractJSON } from '../utils/jsonHelper.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

// Generate interview questions using AI
export const generateAllQuestions = async (role, experienceLevel, resumeText, phase, language = 'JavaScript', company = '', difficulty = 'Intermediate') => {
    const companyContext = company ? `Focus on question styles typical at ${company}.` : '';
    
    // Parse skills/projects from resumeText
    let resumeSkills = '';
    let resumeProjects = [];
    try {
        if (resumeText && (resumeText.includes('"skills"') || resumeText.includes('"techStack"'))) {
            // Try to pull JSON out of potential markdown or intro text
            const jsonStart = resumeText.indexOf('{');
            const jsonEnd = resumeText.lastIndexOf('}');
            const jsonStr = (jsonStart !== -1 && jsonEnd !== -1) ? resumeText.substring(jsonStart, jsonEnd + 1) : resumeText;
            const parsed = extractJSON(jsonStr);
            resumeSkills = (parsed.skills || parsed.techStack || []).slice(0, 15).join(', ');
            resumeProjects = (parsed.projects || []).slice(0, 4).map(p => p.title || p.name || '').filter(Boolean);
        } else if (resumeText) {
            // Fallback: search for common tech keywords in raw text
            const commonTech = ['React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'JavaScript', 'Express', 'Redux', 'PostgreSQL', 'Git'];
            resumeSkills = commonTech.filter(t => resumeText.toLowerCase().includes(t.toLowerCase())).join(', ');
        }
    } catch (_) {
        console.log("[AI Service] Resume parsing failed, using raw text context");
    }

    const resumeContext = resumeText 
        ? `CANDIDATE RESUME CONTEXT (First 2000 chars):\n${resumeText.substring(0, 2000)}`
        : '';

    let systemPrompt = '';
    let questionCount = 4;

    if (phase === 'technical') {
        questionCount = 6;
        systemPrompt = `You are a senior technical interviewer at a top tech company.

Role: ${role} | Experience: ${experienceLevel} | Language: ${language} | Target Difficulty: ${difficulty}
${companyContext}
${resumeContext}
${resumeSkills ? `Detected Skills: ${resumeSkills}` : ''}

GOAL: Generate exactly 6 technical interview questions.
DIVERSITY RULE: Do NOT focus on just one technology. If the resume lists multiple skills (e.g., React, Node, SQL), distribute questions across at least 3-4 different areas of their expertise.
RELEVANCE RULE: Questions must be STRICTLY based on technologies or projects found in their resume.

Structure each question object:
- questionText: CLEAR, CONCISE technical question.
- difficulty: EXACTLY one of: "Beginner", "Intermediate", "Advanced".
- type: "technical".
- topic: Specific area (e.g. "React Hooks", "Database Indexing", "DSA", "DBMS", "OS", "System Design").
- resumeContext: Short note on why this fits their resume.

Return ONLY a valid JSON object with a "questions" key containing an array of 6 objects:
{
  "questions": [
    { "questionText": "...", "difficulty": "Beginner|Intermediate|Advanced", "type": "technical", "topic": "...", "resumeContext": "..." }
  ]
}`;
    } else if (phase === 'hr') {
        questionCount = 8;
        const projectNames = resumeProjects.length > 0 
            ? resumeProjects.join(' and ') 
            : 'their primary projects';

        systemPrompt = `You are a senior HR interviewer.

Role: ${role} | Experience: ${experienceLevel} | Target Difficulty: ${difficulty}
${companyContext}
${resumeContext}

GOAL: Generate exactly 8 HR/behavioral questions.
- Question 1: MUST ask the candidate to walk you through their resume.
- Questions 2-5: Standard behavioral (Conflict, Failure, Leadership, Goals, Strengths).
- Questions 6-8: PROJECT SPECIFIC. Reference specific projects like: ${projectNames}.
  Example: "In your ${resumeProjects[0] || 'main project'}, what was the biggest trade-off you made?"

Structure each question object:
- questionText: Behavioral or project-specific question.
- difficulty: EXACTLY one of: "Beginner", "Intermediate", "Advanced".
- type: "hr".
- topic: Behavioral competency or project area.
- resumeContext: Why this fits their background.

Return ONLY a valid JSON object with a "questions" key containing an array of 8 objects:
{
  "questions": [
    { "questionText": "...", "difficulty": "Beginner|Intermediate|Advanced", "type": "hr", "topic": "...", "resumeContext": "..." }
  ]
}`;
    } else if (phase === 'coding') {
        questionCount = 4;
        systemPrompt = `You are a coding interview expert.

Role: ${role} | Experience: ${experienceLevel} | Language: ${language} | Target Difficulty: ${difficulty}
${companyContext}

Generate exactly 4 coding problems in ${language}.
Difficulty: 1 Beginner, 2 Intermediate, 1 Advanced (adjust based on ${difficulty}).
Include clear constraints and example inputs/outputs.

Return ONLY a valid JSON object with a "questions" key containing an array of 4 objects:
{
  "questions": [
    { "title": "...", "difficulty": "Beginner|Intermediate|Advanced", "explanation": "..." }
  ]
}`;
    }

    try {
        console.log(`[AI Service] Generating ${questionCount} ${phase} questions for ${role}...`);
        
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'SpeakEase AI'
            },
            timeout: 40000
        });

        let content = response.data.choices[0].message.content.trim();
        const parsed = extractJSON(content);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        
        console.log(`[AI Service] Successfully generated ${questions.length} ${phase} questions`);
        return questions;

    } catch (error) {
        console.error("[AI Service] AI Generation Error:", error.response?.data || error.message);
        console.log("[AI Service] Using dynamically generated fallback questions");
        return generateDynamicFallbackQuestions(role, experienceLevel, phase, language, company, difficulty);
    }
};

// Get topic-specific questions using AI
export const getTopicQuestions = async (topic, count = 5, resumeContext = null) => {
    try {
        const personalization = resumeContext ? 
            `Based on candidate's experience: ${JSON.stringify(resumeContext).substring(0, 300)}` : '';

        const systemPrompt = `You are an expert technical interviewer specializing in ${topic}.
        
        Generate ${count} comprehensive interview questions about "${topic}".
        ${personalization}
        
        Questions should:
        - Range from basic to advanced concepts
        - Include both theoretical and practical aspects
        - Be specific and detailed
        - Include a helpful hint without giving away the full answer
        
        Return ONLY a valid JSON array:
        [
          {
            "questionText": "The complete question",
            "difficulty": "Beginner|Intermediate|Advanced",
            "hint": "A subtle hint to guide the candidate",
            "modelAnswer": "Brief model answer or key points to cover"
          }
        ]`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 1500
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        let content = response.data.choices[0].message.content.trim();
        const parsed = extractJSON(content);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        
        // Add IDs to questions
        return questions.map((q, index) => ({
            id: `topic-${Date.now()}-${index}`,
            questionText: q.questionText,
            difficulty: q.difficulty || 'Intermediate',
            hint: q.hint || 'Think about the core concepts',
            modelAnswer: q.modelAnswer || ''
        })).slice(0, count);

    } catch (error) {
        console.error("[AI Service] Topic Questions Error:", error);
        // Generate topic-specific fallback dynamically
        return generateTopicFallbackQuestions(topic, count);
    }
};

// Get company-specific questions using AI
export const getCompanyQuestions = async (company, role, count = 5) => {
    try {
        const systemPrompt = `You are an expert interviewer who has conducted hundreds of interviews at ${company}.
        
        Generate ${count} authentic interview questions commonly asked at ${company} for a ${role} position.
        
        For each question, specify:
        - The actual question text as asked at ${company}
        - Difficulty level based on ${company}'s standards
        - Which round it typically appears in (Coding/Technical/HR)
        - Relevant topics/skills tested
        - A subtle hint
        - Key points for a model answer
        
        Return ONLY a valid JSON array:
        [
          {
            "questionText": "The exact question as asked at ${company}",
            "difficulty": "Beginner|Intermediate|Advanced",
            "round": "Coding|Technical|HR",
            "topics": ["topic1", "topic2"],
            "hint": "Subtle hint",
            "modelAnswer": "Key points to cover in answer"
          }
        ]`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 1500
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        let content = response.data.choices[0].message.content.trim();
        const parsed = extractJSON(content);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        
        return questions.map((q, index) => ({
            id: `company-${Date.now()}-${index}`,
            questionText: q.questionText,
            difficulty: q.difficulty || 'Intermediate',
            round: q.round || 'Technical',
            topics: q.topics || [],
            hint: q.hint || '',
            modelAnswer: q.modelAnswer || ''
        })).slice(0, count);

    } catch (error) {
        console.error("[AI Service] Company Questions Error:", error);
        // Generate company-specific fallback dynamically
        return generateCompanyFallbackQuestions(company, role, count);
    }
};

// Generate practice questions using AI
export const generatePracticeQuestionsFromAI = async (topic) => {
    try {
        const systemPrompt = `You are an expert technical interviewer and mentor.
        
        Generate exactly 5 interview questions specifically about "${topic}" for practice purposes.
        
        For each question, provide:
        - A clear title/concept
        - A brief explanation of what the question is testing
        - Appropriate difficulty level
        
        Make questions engaging and practical, ranging from fundamentals to advanced concepts.
        
        Return ONLY a valid JSON array:
        [
          { 
            "title": "Clear question concept/title",
            "explanation": "What this question tests and why it's important",
            "difficulty": "Beginner|Intermediate|Advanced"
          }
        ]`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content.trim();
        const parsed = extractJSON(content);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        
        return questions.map(q => ({
            title: q.title,
            explanation: q.explanation,
            difficulty: q.difficulty || 'Intermediate'
        }));
        
    } catch (error) {
        console.error("[AI Service] Practice Generation Error:", error);
        return generatePracticeFallbackQuestions(topic);
    }
};

// Evaluate user answer using AI
export const evaluateUserAnswer = async (questionText, userAnswer, phase) => {
    let evaluationPrompt = `You are an expert interviewer evaluating a candidate's answer.
    
    Question: "${questionText}"
    Candidate's Answer: "${userAnswer}"
    Interview Phase: ${phase}
    
    Provide a detailed evaluation with scores from 0-100 for each relevant metric.
    Be constructive and specific in your feedback.`;

    if (phase === 'hr') {
        evaluationPrompt += `
        
        Evaluate these specific metrics:
        - communicationSkills: How clearly and effectively they communicate
        - clarity: How well-structured and easy to follow their answer is
        - professionalTone: Appropriateness and professionalism
        - emotionalIntelligence: Self-awareness and empathy shown
        - confidence: Level of confidence in delivery
        
        Return ONLY valid JSON with:
        {
          "communicationSkills": 0-100,
          "clarity": 0-100,
          "professionalTone": 0-100,
          "emotionalIntelligence": 0-100,
          "confidence": 0-100,
          "feedback": "Detailed constructive feedback"
        }`;
    } else {
        evaluationPrompt += `
        
        Evaluate these specific metrics:
        - technicalCorrectness: Accuracy of technical content
        - problemSolving: Approach and methodology
        - technicalDepth: Depth of understanding shown
        - communicationSkills: How well they explain technical concepts
        - confidence: Confidence in delivery
        
        Return ONLY valid JSON with:
        {
          "technicalCorrectness": 0-100,
          "problemSolving": 0-100,
          "technicalDepth": 0-100,
          "communicationSkills": 0-100,
          "confidence": 0-100,
          "feedback": "Detailed constructive feedback"
        }`;
    }

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: evaluationPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 1000
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        let content = response.data.choices[0].message.content.trim();
        const evaluation = extractJSON(content);
        
        const parseScore = (val) => {
            const num = parseInt(val);
            return isNaN(num) ? 75 : num;
        };

        // Ensure all required fields exist with reasonable defaults
        if (phase === 'hr') {
            return {
                communicationSkills: parseScore(evaluation.communicationSkills),
                clarity: parseScore(evaluation.clarity),
                professionalTone: parseScore(evaluation.professionalTone),
                emotionalIntelligence: parseScore(evaluation.emotionalIntelligence),
                confidence: parseScore(evaluation.confidence),
                feedback: evaluation.feedback || 'Good attempt! Here are some areas to improve...'
            };
        } else {
            return {
                technicalCorrectness: parseScore(evaluation.technicalCorrectness),
                problemSolving: parseScore(evaluation.problemSolving),
                technicalDepth: parseScore(evaluation.technicalDepth),
                communicationSkills: parseScore(evaluation.communicationSkills),
                confidence: parseScore(evaluation.confidence),
                feedback: evaluation.feedback || 'Good attempt! Here are some areas to improve...'
            };
        }

    } catch (error) {
        console.error("[AI Service] Evaluation Error:", error);
        // Return dynamic evaluation based on answer length as fallback
        return generateFallbackEvaluation(questionText, userAnswer, phase);
    }
};

// Evaluate practice answer using AI
export const evaluatePracticeAnswer = async (question, userAnswer) => {
    const questionText = typeof question === 'string' ? question : question.title || question.questionText;
    
    const prompt = `You are a technical mentor evaluating a practice answer.
    
    Question: ${questionText}
    User Answer: ${userAnswer}
    
    Provide a helpful evaluation with:
    - Score from 1-10
    - Key strengths in their answer
    - Important points they missed
    - A comprehensive model answer they can learn from
    
    Return ONLY valid JSON:
    {
      "score": 1-10,
      "strengths": ["strength1", "strength2"],
      "missingPoints": ["point1", "point2"],
      "modelAnswer": "Complete model answer covering all key points"
    }`;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 1500
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        let content = response.data.choices[0].message.content;
        return extractJSON(content);
        
    } catch (error) {
        console.error("[AI Service] Practice Evaluation Error:", error);
        return generatePracticeEvaluationFallback(questionText, userAnswer);
    }
};

// Generate practice hint using AI
export const generatePracticeHint = async (question) => {
    const questionText = typeof question === 'string' ? question : question.title || question.questionText;
    
    const prompt = `You are a helpful technical mentor. Provide a subtle hint for this interview question without giving away the full answer.
    
    Question: ${questionText}
    
    The hint should:
    - Guide thinking without revealing the solution
    - Point to relevant concepts or approaches
    - Be encouraging and helpful
    - Be 1-2 sentences only
    
    Return ONLY the hint text.`;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 300
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content.trim();
        
    } catch (error) {
        console.error("[AI Service] Hint Generation Error:", error);
        return "Think about the core concepts and break down the problem into smaller parts.";
    }
};

// ============ DYNAMIC FALLBACK FUNCTIONS ============

function generateDynamicFallbackQuestions(role, experienceLevel, phase, language, company, difficulty = 'Intermediate') {
    const questions = [];
    const count = 4;
    
    for (let i = 0; i < count; i++) {
        if (phase === 'coding') {
            questions.push({
                questionText: generateCodingQuestion(language, i),
                difficulty: i < 2 ? 'Beginner' : i === 2 ? 'Intermediate' : 'Advanced'
            });
        } else if (phase === 'hr') {
            questions.push({
                questionText: generateHRQuestion(role, i),
                difficulty: 'Intermediate'
            });
        } else {
            questions.push({
                questionText: generateTechnicalQuestion(role, company, i),
                difficulty: difficulty !== 'Mixed' ? difficulty : (i < 2 ? 'Beginner' : 'Intermediate')
            });
        }
    }
    
    return questions;
}

function generateCodingQuestion(language, index) {
    const questions = [
        `Write a function to find the factorial of a number in ${language}.`,
        `Implement a function to check if a string is a palindrome in ${language}.`,
        `Write a function to find the maximum subarray sum in ${language}.`,
        `Implement a binary search tree class in ${language} with insert and search methods.`
    ];
    return questions[index] || questions[0];
}

function generateHRQuestion(role, index) {
    const questions = [
        `Could you walk me through your resume and highlight your key experiences?`,
        `Tell me about a challenging project you worked on as a ${role}.`,
        `How do you handle disagreements with team members?`,
        `Where do you see your career in the next 5 years?`
    ];
    return questions[index] || questions[0];
}

function generateTechnicalQuestion(role, company, index) {
    const company_str = company ? `at ${company}` : '';
    const questions = [
        `Explain the difference between REST and GraphQL APIs.`,
        `How would you design a scalable system for a social media platform?`,
        `What are the key considerations when choosing a database for a new application?`,
        `Explain how you would optimize a slow-performing web application.`
    ];
    return questions[index] || questions[0];
}

function generateTopicFallbackQuestions(topic, count) {
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            id: `topic-fallback-${i}`,
            questionText: `Explain a key concept in ${topic}${i > 0 ? ' with practical examples' : ''}.`,
            difficulty: i % 3 === 0 ? 'Advanced' : (i % 2 === 0 ? 'Intermediate' : 'Beginner'),
            hint: 'Think about the fundamental principles and how they apply in real scenarios.',
            modelAnswer: `This question tests understanding of ${topic}. Key points include...`
        });
    }
    return questions;
}

function generateCompanyFallbackQuestions(company, role, count) {
    const questions = [];
    for (let i = 0; i < count; i++) {
        const rounds = ['Coding', 'Technical', 'HR'];
        questions.push({
            id: `company-fallback-${i}`,
            questionText: `Common ${company} interview question for ${role} position.`,
            difficulty: i % 3 === 0 ? 'Advanced' : 'Intermediate',
            round: rounds[i % 3],
            topics: ['General', 'Problem Solving'],
            hint: 'Research common interview patterns at this company.',
            modelAnswer: 'Prepare by reviewing typical questions and practicing your responses.'
        });
    }
    return questions;
}

function generatePracticeFallbackQuestions(topic) {
    const questions = [];
    for (let i = 0; i < 5; i++) {
        questions.push({
            title: `${topic} Concept ${i + 1}`,
            explanation: `This question tests understanding of ${topic} fundamentals and practical applications.`,
            difficulty: i % 3 === 0 ? 'Advanced' : (i % 2 === 0 ? 'Intermediate' : 'Beginner')
        });
    }
    return questions;
}

function generateFallbackEvaluation(questionText, userAnswer, phase) {
    const wordCount = userAnswer.split(' ').length;
    const baseScore = Math.min(85, 60 + Math.floor(wordCount / 10));
    
    if (phase === 'hr') {
        return {
            communicationSkills: baseScore,
            clarity: baseScore - 5,
            professionalTone: baseScore + 5,
            emotionalIntelligence: baseScore,
            confidence: baseScore,
            feedback: `Your answer was ${wordCount > 50 ? 'comprehensive' : 'brief'}. Try to provide specific examples and structure your response clearly.`
        };
    } else {
        return {
            technicalCorrectness: baseScore,
            problemSolving: baseScore - 5,
            technicalDepth: baseScore - 10,
            communicationSkills: baseScore,
            confidence: baseScore,
            feedback: `Good attempt! Consider adding more technical details and explaining your thought process.`
        };
    }
}

// Analyze resume for improvements
export const analyzeResume = async (resumeText, targetRole = 'Software Engineer') => {
    const systemPrompt = `You are a world-class resume reviewer and career coach.
    
    Analyze the following resume text for a candidate targeting the role of: ${targetRole}.
    Provide actionable feedback to improve the resume and increase chances of getting hired.
    
    Resume Text:
    ${resumeText.substring(0, 4000)}
    
    Your analysis should include:
    1. Overall Score (0-100)
    2. Summary (Short 2-sentence overview)
    3. Strengths (Top 3-4 points)
    4. Weaknesses/Areas for Improvement (Actionable points)
    5. Keyword Suggestions (Skills or terms missing but relevant to ${targetRole})
    6. Formatting & Structure Tips
    
    Return ONLY a valid JSON object:
    {
      "score": number,
      "summary": "string",
      "strengths": ["string"],
      "improvements": ["string"],
      "missingKeywords": ["string"],
      "formattingTips": ["string"]
    }`;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'SpeakEase AI'
            },
            timeout: 30000
        });

        let content = response.data.choices[0].message.content.trim();
        
        const parsedContent = extractJSON(content);
        return {
            score: parsedContent.score || 75,
            summary: parsedContent.summary || "Summary unavailable",
            strengths: parsedContent.strengths || [],
            improvements: parsedContent.improvements || [],
            missingKeywords: parsedContent.missingKeywords || [],
            formattingTips: parsedContent.formattingTips || []
        };
    } catch (error) {
        console.error("[AI Service] Resume Analysis Error:", error);
        return {
            score: 75,
            summary: "We couldn't perform a deep analysis right now, but here are some general tips.",
            strengths: ["Professional layout", "Clear contact information"],
            improvements: ["Use more action verbs", "Quantify your achievements with numbers"],
            missingKeywords: ["Leadership", "Agile Methodology", "Problem Solving"],
            formattingTips: ["Keep it to 1-2 pages", "Use a modern, sans-serif font"]
        };
    }
};

function generatePracticeEvaluationFallback(questionText, userAnswer) {
    return {
        score: 7,
        strengths: ['You attempted to answer the question'],
        missingPoints: ['Could benefit from more specific examples', 'Consider structuring your answer better'],
        modelAnswer: `A good answer to "${questionText}" would include: key concepts, practical examples, and clear explanations.`
    };
}