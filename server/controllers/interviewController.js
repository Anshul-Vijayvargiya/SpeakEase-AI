import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { extractTextFromPDF } from '../services/resumeParser.js';
import { 
  generateAllQuestions, 
  evaluateUserAnswer, 
  generatePracticeQuestionsFromAI, 
  getTopicQuestions, 
  getCompanyQuestions, 
  evaluatePracticeAnswer, 
  generatePracticeHint 
} from '../services/aiService.js';

// 1. Generate Interview Session (with manual entry support)
export const generateQuestions = async (req, res) => {
  try {
    console.log('[Interview Controller] Generating new interview session...');
    const userId = req.user._id;
    const { 
      role: roleRaw, 
      targetRole,
      experienceLevel: experienceLevelRaw, 
      mode = 'standard', 
      interviewType: interviewTypeRaw, 
      interviewMode,
      company = '', 
      topic = '', 
      language = 'JavaScript',
      difficulty: frontendDifficulty,
      manualData // For manual entry fallback
    } = req.body;

    const role = (roleRaw || targetRole || 'Software Engineer').trim();
    const experienceLevel = (experienceLevelRaw || 'Junior').trim();
    const interviewType = (interviewTypeRaw || interviewMode || 'technical').toLowerCase();
    
    console.log(`[Interview Controller] Role: ${role}, Experience: ${experienceLevel}, Type: ${interviewType}`);
    
    // Map difficulty
    let difficulty = 'Intermediate';
    if (frontendDifficulty === 'Easy') difficulty = 'Beginner';
    else if (frontendDifficulty === 'Medium') difficulty = 'Intermediate';
    else if (frontendDifficulty === 'Hard') difficulty = 'Advanced';
    else if (frontendDifficulty === 'Mixed') difficulty = 'Mixed';
    else difficulty = 'Intermediate';

    console.log(`[Interview Controller] Mapped Difficulty: ${difficulty}`);
    
    let resumeText = '';
    let user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found in system.' });
    }

    // Handle manual data if provided (from "Enter Manually" option)
    if (manualData && Object.keys(manualData).length > 0) {
      console.log('[Interview Controller] Using manual data entry');
      
      // Save manual data to user profile
      const manualResumeData = {
        name: manualData.name || user.name,
        role: manualData.role || role,
        experienceLevel: manualData.experienceLevel || experienceLevel,
        skills: manualData.skills || [],
        techStack: manualData.techStack || [language],
        projects: manualData.projects || [],
        experience: manualData.experience || []
      };
      
      user.resumeData = manualResumeData;
      await user.save();
      
      resumeText = `Candidate Profile (Manual Entry):\n${JSON.stringify(manualResumeData, null, 2)}`;
    }
    // Extract resume if provided
    else if (req.file) {
      console.log('[Interview Controller] Extracting text from PDF...');
      try {
        resumeText = await extractTextFromPDF(req.file.buffer);
        console.log('[Interview Controller] Resume extracted successfully');
      } catch (pdfError) {
        console.error('[Interview Controller] PDF extraction error:', pdfError);
        // Continue with empty resume, will use manual entry flow
      }
    }

    // If no resume text and no manual data, use stored resume data
    if (!resumeText && !manualData && user.resumeData) {
      resumeText = `Candidate Profile (Stored):\n${JSON.stringify(user.resumeData, null, 2)}`;
      console.log('[Interview Controller] Using stored resume data');
    }

    // Save target companies to user profile
    if (company) {
        const companiesArr = company.split(',').map(c => c.trim()).filter(c => c);
        user.targetCompanies = Array.from(new Set([...(user.targetCompanies || []), ...companiesArr]));
        await user.save();
    }

    let interviewPhase = interviewType === 'full-simulation' ? 'coding' : 
                        (interviewType === 'hr' ? 'hr' : 'technical');
    let codingResults = [];
    let technicalResults = [];
    let hrResults = [];

    // Formatter helper with defensive sanitation
    const formatQuestions = (questionsData, phase) => questionsData.map(q => {
      // Map common AI hallucinations to valid enum values
      let difficulty = q.difficulty || 'Intermediate';
      if (difficulty === 'High' || difficulty === 'Hard') difficulty = 'Advanced';
      if (difficulty === 'Low' || difficulty === 'Easy') difficulty = 'Beginner';
      if (difficulty === 'Medium') difficulty = 'Intermediate';
      if (!['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) difficulty = 'Intermediate';

      let type = q.type || phase || 'technical';
      if (type === 'project') type = phase || 'technical';
      if (!['technical', 'hr', 'coding'].includes(type)) type = 'technical';

      return {
        questionText: q.questionText,
        difficulty,
        type,
        topic: q.topic || '',
        resumeContext: q.resumeContext || '',
        userAnswer: '',
        metrics: {
          confidence: null, 
          feedback: '',
          technicalCorrectness: null, 
          problemSolving: null, 
          technicalDepth: null,
          communicationSkills: null, 
          clarity: null, 
          professionalTone: null, 
          emotionalIntelligence: null
        }
      };
    });

    // Generate questions with error handling
    try {
      if (req.body.questions && Array.isArray(req.body.questions)) {
        console.log('[Interview Controller] Using provided pre-generated questions');
        const formatted = req.body.questions.map(q => ({
          questionText: q.question || q.questionText,
          difficulty: q.difficulty || 'Intermediate',
          type: interviewType === 'hr' ? 'hr' : 'technical',
          topic: q.category || q.topic || '',
          resumeContext: q.whyAsked || '',
          userAnswer: '',
          metrics: {
            confidence: null, feedback: '', technicalCorrectness: null, problemSolving: null, technicalDepth: null,
            communicationSkills: null, clarity: null, professionalTone: null, emotionalIntelligence: null
          }
        }));

        if (interviewType === 'hr') hrResults = formatted;
        else technicalResults = formatted;
        
      } else if (interviewType === 'full-simulation') {
        interviewPhase = 'coding';
        const [codingQ, techQ, hrQ] = await Promise.all([
          generateAllQuestions(role, experienceLevel, resumeText, 'coding', language, company, difficulty),
          generateAllQuestions(role, experienceLevel, resumeText, 'technical', language, company, difficulty),
          generateAllQuestions(role, experienceLevel, resumeText, 'hr', language, company, difficulty)
        ]);
        codingResults = formatQuestions(codingQ, 'coding'); 
        technicalResults = formatQuestions(techQ, 'technical');
        hrResults = formatQuestions(hrQ, 'hr');
      } else {
        const questionsData = await generateAllQuestions(role, experienceLevel, resumeText, interviewPhase, language, company, difficulty);
        if (interviewPhase === 'technical') technicalResults = formatQuestions(questionsData, 'technical');
        if (interviewPhase === 'hr') hrResults = formatQuestions(questionsData, 'hr');
        if (interviewPhase === 'coding') codingResults = formatQuestions(questionsData, 'coding');
      }
    } catch (aiError) {
      console.error('[Interview Controller] AI generation error, using fallback questions:', aiError);
      
      // Use fallback questions based on interview type
      const fallbackQuestions = getFallbackQuestions(interviewType, interviewPhase);
      
      if (interviewType === 'full-simulation') {
        codingResults = fallbackQuestions.coding || [];
        technicalResults = fallbackQuestions.technical || [];
        hrResults = fallbackQuestions.hr || [];
      } else if (interviewPhase === 'technical') {
        technicalResults = fallbackQuestions;
      } else if (interviewPhase === 'hr') {
        hrResults = fallbackQuestions;
      } else if (interviewPhase === 'coding') {
        codingResults = fallbackQuestions;
      }
    }

    const interview = new Interview({
      userId,
      role,
      experienceLevel,
      interviewType,
      company,
      topic,
      language,
      codingResults,
      technicalResults,
      hrResults,
      status: 'Pending'
    });

    console.log('[Interview Controller] Saving interview to database...');
    await interview.save();
    console.log(`[Interview Controller] Interview saved successfully with ID: ${interview._id}`);

    // Flatten questions for frontend
    const allQuestions = [
      ...codingResults,
      ...technicalResults,
      ...hrResults
    ];

    res.status(201).json({ 
      sessionId: interview._id,
      interviewId: interview._id, 
      questions: allQuestions,
      remainingCredits: user.credits,
      message: 'Interview session created successfully',
      usingManualData: !!manualData
    });
    
  } catch (error) {
    console.error('Interview Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate interview session: ' + error.message });
  }
};

// Helper function for fallback questions
function getFallbackQuestions(type, phase) {
  const questions = {
    coding: [
      { questionText: "Write a function to reverse a string.", difficulty: "Beginner" },
      { questionText: "Find the maximum element in an array.", difficulty: "Beginner" },
      { questionText: "Implement a binary search algorithm.", difficulty: "Intermediate" },
      { questionText: "Check if a string is a palindrome.", difficulty: "Beginner" }
    ],
    technical: [
      { questionText: "Explain the difference between REST and GraphQL.", difficulty: "Intermediate" },
      { questionText: "What is the difference between SQL and NoSQL databases?", difficulty: "Beginner" },
      { questionText: "Explain how HTTP works.", difficulty: "Intermediate" },
      { questionText: "What is caching and why is it important?", difficulty: "Beginner" }
    ],
    hr: [
      { questionText: "Tell me about yourself.", difficulty: "Beginner" },
      { questionText: "Why do you want to work here?", difficulty: "Intermediate" },
      { questionText: "Where do you see yourself in 5 years?", difficulty: "Beginner" }
    ]
  };

  if (type === 'full-simulation') {
    return questions;
  }
  
  return questions[phase] || questions.technical;
}

// 2. Generate Practice Questions by Topic
export const generatePracticeQuestions = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    console.log(`[Interview Controller] Generating practice questions for topic: ${topic}`);
    const questions = await generatePracticeQuestionsFromAI(topic);

    res.status(200).json({ questions });
  } catch (error) {
    console.error('Practice Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate practice questions' });
  }
};

// 3. Get Topic-Specific Questions
export const getTopicQuestionsHandler = async (req, res) => {
  try {
    const { topic } = req.params;
    const { count = 5 } = req.query;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`[Interview Controller] Fetching ${count} questions for topic: ${topic}`);

    // Get user data for personalization
    const user = await User.findById(req.user._id);
    const resumeContext = user?.resumeData ? user.resumeData : null;

    const questions = await getTopicQuestions(topic, count, resumeContext);
    
    res.status(200).json({ 
      topic,
      questions,
      total: questions.length
    });
    
  } catch (error) {
    console.error('Topic Questions Error:', error);
    res.status(500).json({ error: 'Failed to generate topic questions' });
  }
};

// 4. Get Company-Specific Questions
export const getCompanyQuestionsHandler = async (req, res) => {
  try {
    const { company } = req.params;
    const { role = 'Software Engineer', count = 5 } = req.query;

    console.log(`[Interview Controller] Fetching ${company} questions for ${role}`);

    const questions = await getCompanyQuestions(company, role, count);
    
    res.status(200).json({ 
      company,
      role,
      questions,
      total: questions.length
    });
    
  } catch (error) {
    console.error('Company Questions Error:', error);
    res.status(500).json({ error: 'Failed to generate company questions' });
  }
};

// 5. Get Next Question (FIXED FLOW)
export const getNextQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findOne({ _id: id, userId: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    if (interview.status === 'Completed') {
      return res.status(400).json({ error: 'Interview already completed' });
    }

    // Helper to get questions array for a specific phase
    const getQuestionsByPhase = (phase) => {
      if (phase === 'coding') return interview.codingResults;
      if (phase === 'technical') return interview.technicalResults;
      if (phase === 'hr') return interview.hrResults;
      return [];
    };

    let currentPhase = interview.interviewPhase;
    let questionsArray = getQuestionsByPhase(currentPhase);

    // Check if we've completed all questions in current phase
    if (interview.currentQuestionIndex >= questionsArray.length) {
      if (interview.interviewType === 'full-simulation') {
        // Phase transition logic - FIXED
        if (currentPhase === 'coding') {
          interview.interviewPhase = 'technical';
          interview.currentQuestionIndex = 0;
          await interview.save();
          
          return res.status(200).json({ 
            phaseCompleted: 'coding',
            nextPhase: 'technical',
            message: '🎉 Coding round completed! Moving to Technical round.',
            phase: 'technical',
            index: 0,
            totalQuestions: interview.technicalResults.length
          });
        } 
        else if (currentPhase === 'technical') {
          interview.interviewPhase = 'hr';
          interview.currentQuestionIndex = 0;
          await interview.save();
          
          return res.status(200).json({ 
            phaseCompleted: 'technical',
            nextPhase: 'hr',
            message: '🎉 Technical round completed! Moving to HR round.',
            phase: 'hr',
            index: 0,
            totalQuestions: interview.hrResults.length
          });
        } 
        else if (currentPhase === 'hr') {
          interview.status = 'Completed';
          await interview.save();
          return res.status(200).json({ 
            completed: true,
            message: '🎉 Congratulations! You have completed all rounds!'
          });
        }
      } else {
        // For non-full simulation
        interview.status = 'Completed';
        await interview.save();
        return res.status(200).json({ 
          completed: true,
          message: 'Interview completed!'
        });
      }
    }

    // Get the current question
    const currentQuestion = questionsArray[interview.currentQuestionIndex];
    
    // Prepare question object based on phase
    let questionResponse = {
      questionText: currentQuestion.questionText,
      difficulty: currentQuestion.difficulty
    };

    // Add phase-specific hints for practice hub
    if (interview.interviewType === 'practice') {
      questionResponse.hint = currentQuestion.hint || null;
    }

    res.status(200).json({
      question: questionResponse,
      phase: interview.interviewPhase,
      index: interview.currentQuestionIndex,
      questionId: currentQuestion._id,
      totalQuestions: questionsArray.length,
      interviewType: interview.interviewType
    });
    
  } catch (error) {
    console.error('Next Question Error:', error);
    res.status(500).json({ error: 'Failed to fetch next question' });
  }
};

// 6. Evaluate Candidate Answer
export const evaluateAnswer = async (req, res) => {
  try {
    console.log('[evaluateAnswer] req.body:', req.body);
    const { interviewId, questionId, userAnswer, behavioralMetrics } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Find question in all phases
    let question = null;
    let foundPhase = null;

    const phaseMap = {
      coding: interview.codingResults,
      technical: interview.technicalResults,
      hr: interview.hrResults
    };

    // Search in all phases
    for (const [phase, arr] of Object.entries(phaseMap)) {
      question = arr.find(q => q._id && q._id.toString() === questionId);
      if (question) { 
        foundPhase = phase; 
        break; 
      }
    }

    if (!question) {
      console.error(`[evaluateAnswer] questionId ${questionId} not found in any phase`);
      return res.status(404).json({ error: 'Question not found' });
    }

    // Evaluate answer based on phase
    const evaluation = await evaluateUserAnswer(
      question.questionText, 
      userAnswer, 
      foundPhase || interview.interviewPhase
    );

    // Update question with answer and metrics
    question.userAnswer = userAnswer;
    question.metrics = { 
      ...question.metrics, 
      ...evaluation,
      eyeContactScore: behavioralMetrics?.eyeContact || 0,
      attentionScore: behavioralMetrics?.attention || 0,
      behaviorSummary: behavioralMetrics?.expression || 'Focused',
      fillerCount: behavioralMetrics?.fillerCount ?? 0,
      wpm: behavioralMetrics?.wpm ?? 0
    };

    if (interview.status === 'Pending') {
      interview.status = 'In Progress';
    }

    // Only increment index for non-practice interviews
    if (interview.interviewType !== 'practice') {
      interview.currentQuestionIndex += 1;
      interview.totalQuestionsAsked += 1;
    }

    await interview.save();

    res.status(200).json({ 
      evaluation, 
      interviewStatus: interview.status,
      nextQuestionAvailable: interview.currentQuestionIndex < 
        (interview.interviewPhase === 'coding' ? interview.codingResults.length :
         interview.interviewPhase === 'technical' ? interview.technicalResults.length :
         interview.hrResults.length)
    });
  } catch (error) {
    console.error('Evaluation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate answer' });
  }
};

// 7. Finish Interview & Compute Score
export const finishInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findOne({ _id: id, userId: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    interview.status = 'Completed';
    interview.interviewPhase = 'completed';

    // Calculate scores
    const allQuestions = [
      ...(interview.codingResults || []),
      ...(interview.technicalResults || []),
      ...(interview.hrResults || [])
    ];

    let totalTech = 0, totalHr = 0, techCount = 0, hrCount = 0;

    allQuestions.forEach(q => {
      if (q.metrics) {
        if (q.type === 'technical' || q.type === 'coding') {
          totalTech += (q.metrics.technicalCorrectness || 0);
          techCount++;
        } else if (q.type === 'hr') {
          totalHr += (q.metrics.communicationSkills || 0);
          hrCount++;
        }
      }
    });

    const technicalScore = techCount > 0 ? Math.round(totalTech / techCount) : 0;
    const hrPerformance = hrCount > 0 ? Math.round(totalHr / hrCount) : 0;
    
    interview.technicalScore = technicalScore;
    interview.hrPerformance = hrPerformance;
    
    // Overall score is weighted: Technical (70%), HR (30%) if both exist.
    if (techCount > 0 && hrCount > 0) {
      interview.overallScore = Math.round((technicalScore * 0.7) + (hrPerformance * 0.3));
    } else if (techCount > 0) {
      interview.overallScore = technicalScore;
    } else if (hrCount > 0) {
      interview.overallScore = hrPerformance;
    } else {
      interview.overallScore = 0;
    }
    
    await interview.save();
    
    // Generate report URL
    const reportUrl = `/api/reports/generate/${interview._id}`;
    
    res.status(200).json({
      overallScore: interview.overallScore,
      codingScore: interview.codingScore,
      technicalScore: interview.technicalScore,
      hrPerformance: interview.hrPerformance,
      finalFeedback: interview.finalFeedback,
      strengths: interview.strengths,
      improvements: interview.improvements,
      reportUrl: reportUrl,
      message: 'Interview completed successfully!'
    });

  } catch (error) {
    console.error('Finish Interview Error:', error);
    res.status(500).json({ error: 'Failed to finish interview' });
  }
};

// 8. Fetch Interview by ID
export const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.status(200).json(interview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
};

// 9. Fetch User's Interview History
export const getInterviewHistory = async (req, res) => {
  try {
    console.log(`[getInterviewHistory] Fetching history for user: ${req.user._id}`);
    const interviews = await Interview.find({ userId: req.user._id })
      .select('role experienceLevel status overallScore createdAt interviewType')
      .sort({ createdAt: -1 });

    console.log(`[getInterviewHistory] Found ${interviews.length} interviews`);
    res.status(200).json(interviews);
  } catch (error) {
    console.error('History Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch interview history' });
  }
};

// 10. Delete an Interview Session
export const deleteInterview = async (req, res) => {
  try {
    console.log(`[Delete Interview] user: ${req.user._id}, interviewId: ${req.params.id}`);
    const interview = await Interview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!interview) {
      console.log(`[Delete Interview] Result: Not Found`);
      return res.status(404).json({ error: 'Interview not found' });
    }

    console.log(`[Delete Interview] Result: Success`);
    res.status(200).json({ message: 'Interview deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete Interview Error:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
};

// 11. Evaluate Practice Answer
export const evaluatePracticeAnswerHandler = async (req, res) => {
  try {
    const { question, userAnswer } = req.body;
    if (!question || !userAnswer) {
      return res.status(400).json({ error: 'Missing question or answer data' });
    }

    const evaluation = await evaluatePracticeAnswer(question, userAnswer);
    res.status(200).json(evaluation);
  } catch (error) {
    console.error("Practice evaluation error:", error);
    res.status(500).json({ error: 'Failed to evaluate practice answer' });
  }
};

// 12. Generate Practice Hint
export const getPracticeHintHandler = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Missing question data' });
    }

    const hint = await generatePracticeHint(question);
    res.status(200).json({ hint });
  } catch (error) {
    console.error("Practice hint error:", error);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
};