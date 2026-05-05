import Interview from '../models/Interview.js';
import User from '../models/User.js';

// Generate interview report
export const generateReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[Report Controller] Generating report for interview: ${id}`);
    
    const interview = await Interview.findOne({ 
      _id: id, 
      userId: req.user._id 
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // If interview is not completed, complete it first
    if (interview.status !== 'Completed') {
      interview.status = 'Completed';
      await interview.save();
    }

    // Calculate detailed scores if not already calculated
    if (!interview.overallScore) {
      await calculateInterviewScores(interview);
    }

    // Generate comprehensive report
    const report = {
      interviewId: interview._id,
      candidateName: req.user.name || 'Candidate',
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      interviewType: interview.interviewType,
      date: interview.createdAt,
      overallScore: interview.overallScore || 0,
      
      // Round-wise performance
      rounds: {
        coding: {
          score: interview.codingScore || 0,
          questions: interview.codingResults.map(q => ({
            question: q.questionText,
            answer: q.userAnswer || 'Not answered',
            score: calculateQuestionScore(q, 'coding'),
            feedback: q.metrics?.feedback || 'No feedback available'
          }))
        },
        technical: {
          score: interview.technicalScore || 0,
          questions: interview.technicalResults.map(q => ({
            question: q.questionText,
            answer: q.userAnswer || 'Not answered',
            score: calculateQuestionScore(q, 'technical'),
            feedback: q.metrics?.feedback || 'No feedback available'
          }))
        },
        hr: {
          score: interview.hrPerformance || 0,
          questions: interview.hrResults.map(q => ({
            question: q.questionText,
            answer: q.userAnswer || 'Not answered',
            score: calculateQuestionScore(q, 'hr'),
            feedback: q.metrics?.feedback || 'No feedback available'
          }))
        }
      },

      // Summary metrics
      summary: {
        totalQuestions: interview.totalQuestionsAsked || 0,
        strengths: interview.strengths || [],
        improvements: interview.improvements || [],
        finalFeedback: interview.finalFeedback || 'Interview completed successfully.'
      },

      // Performance metrics
      metrics: {
        technicalAccuracy: calculateAverageMetric(interview, 'technicalCorrectness'),
        problemSolving: calculateAverageMetric(interview, 'problemSolving'),
        communication: calculateAverageMetric(interview, 'communicationSkills'),
        confidence: calculateAverageMetric(interview, 'confidence'),
        eyeContact: calculateAverageMetric(interview, 'eyeContactScore'),
        attention: calculateAverageMetric(interview, 'attentionScore')
      }
    };

    res.status(200).json(report);

  } catch (error) {
    console.error('[Report Controller] Error:', error);
    res.status(500).json({ error: 'Failed to generate report: ' + error.message });
  }
};

// Get all reports for user
export const getAllReports = async (req, res) => {
  try {
    const interviews = await Interview.find({ 
      userId: req.user._id,
      status: 'Completed'
    })
    .select('role interviewType overallScore createdAt codingScore technicalScore hrPerformance')
    .sort({ createdAt: -1 });

    const reports = interviews.map(interview => ({
      id: interview._id,
      role: interview.role,
      type: interview.interviewType,
      date: interview.createdAt,
      overallScore: interview.overallScore || 0,
      scores: {
        coding: interview.codingScore || 0,
        technical: interview.technicalScore || 0,
        hr: interview.hrPerformance || 0
      }
    }));

    res.status(200).json(reports);

  } catch (error) {
    console.error('[Report Controller] Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Get single report by ID
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findOne({ 
      _id: id, 
      userId: req.user._id 
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Generate report on the fly
    const report = {
      interviewId: interview._id,
      role: interview.role,
      type: interview.interviewType,
      date: interview.createdAt,
      overallScore: interview.overallScore || 0,
      status: interview.status,
      details: interview
    };

    res.status(200).json(report);

  } catch (error) {
    console.error('[Report Controller] Error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// Delete report
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findOneAndDelete({ 
      _id: id, 
      userId: req.user._id 
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('[Report Controller] Error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};

// Helper function to calculate interview scores
async function calculateInterviewScores(interview) {
  // Calculate coding score
  let codingScore = 0;
  if (interview.codingResults.length > 0) {
    let sum = 0;
    let count = 0;
    interview.codingResults.forEach(q => {
      if (q.metrics && q.metrics.technicalCorrectness) {
        sum += (q.metrics.technicalCorrectness + (q.metrics.problemSolving || 0)) / 2;
        count++;
      }
    });
    codingScore = count > 0 ? sum / count : 0;
  }

  // Calculate technical score
  let technicalScore = 0;
  if (interview.technicalResults.length > 0) {
    let sum = 0;
    let count = 0;
    interview.technicalResults.forEach(q => {
      if (q.metrics && q.metrics.technicalCorrectness) {
        sum += (q.metrics.technicalCorrectness + (q.metrics.problemSolving || 0) + (q.metrics.technicalDepth || 0)) / 3;
        count++;
      }
    });
    technicalScore = count > 0 ? sum / count : 0;
  }

  // Calculate HR score
  let hrScore = 0;
  if (interview.hrResults.length > 0) {
    let sum = 0;
    let count = 0;
    interview.hrResults.forEach(q => {
      if (q.metrics && q.metrics.communicationSkills) {
        sum += (q.metrics.communicationSkills + (q.metrics.clarity || 0) + (q.metrics.professionalTone || 0) + (q.metrics.emotionalIntelligence || 0) + (q.metrics.confidence || 0)) / 5;
        count++;
      }
    });
    hrScore = count > 0 ? sum / count : 0;
  }

  interview.codingScore = codingScore;
  interview.technicalScore = technicalScore;
  interview.hrPerformance = hrScore;
  
  if (interview.interviewType === 'full-simulation') {
    interview.overallScore = (codingScore + technicalScore + hrScore) / 3;
  } else if (interview.interviewType === 'hr') {
    interview.overallScore = hrScore;
  } else {
    interview.overallScore = interview.interviewPhase === 'coding' ? codingScore : technicalScore;
  }

  // Factor in behavioral performance into overall score (weighted 20%)
  const behavioralAvg = calculateAverageMetric(interview, 'eyeContactScore') * 0.5 + calculateAverageMetric(interview, 'attentionScore') * 0.5;
  if (behavioralAvg > 0) {
    interview.overallScore = (interview.overallScore * 0.8) + (behavioralAvg * 0.2);
  }

  await interview.save();
}

// Helper to calculate question score
function calculateQuestionScore(question, type) {
  if (!question.metrics) return 0;
  
  if (type === 'hr') {
    return Math.round(
      ((question.metrics.communicationSkills || 0) +
       (question.metrics.clarity || 0) +
       (question.metrics.professionalTone || 0) +
       (question.metrics.emotionalIntelligence || 0) +
       (question.metrics.confidence || 0)) / 5
    );
  } else {
    return Math.round(
      ((question.metrics.technicalCorrectness || 0) +
       (question.metrics.problemSolving || 0) +
       (question.metrics.technicalDepth || 0)) / 3
    );
  }
}

// Helper to calculate average metric
function calculateAverageMetric(interview, metricName) {
  let total = 0;
  let count = 0;
  
  const allResults = [
    ...(interview.codingResults || []), 
    ...(interview.technicalResults || []), 
    ...(interview.hrResults || [])
  ];

  allResults.forEach(q => {
    if (q.metrics && q.metrics[metricName]) {
      total += q.metrics[metricName];
      count++;
    }
  });
  
  return count > 0 ? Math.round(total / count) : 0;
}