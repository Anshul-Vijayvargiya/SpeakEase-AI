const DailyQuestion = require('../models/DailyQuestion');
const { generateSingleQuestion } = require('../services/aiService');

exports.getDailyQuestion = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dailyQuestion = await DailyQuestion.findOne({ date: { $gte: today } });

        if (!dailyQuestion) {
            // Generate a random question for the day
            const questionData = await generateSingleQuestion(
                'Software Engineer',
                'Junior',
                '',
                'technical',
                Math.floor(Math.random() * 5) // Random difficulty somewhat
            );

            dailyQuestion = new DailyQuestion({
                question: questionData.questionText,
                date: today
            });

            await dailyQuestion.save();
        }

        res.status(200).json(dailyQuestion);
    } catch (error) {
        console.error('Error fetching daily question:', error);
        res.status(500).json({ error: 'Failed to fetch daily question' });
    }
};
