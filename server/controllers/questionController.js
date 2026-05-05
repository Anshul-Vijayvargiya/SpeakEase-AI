import Question from '../models/Question.js';

// Get all questions with optional filters
export const getAllQuestions = async (req, res) => {
    try {
        const { company, topic, difficulty, round, tags } = req.query;
        let query = {};

        if (company) query.company = { $regex: new RegExp(company, 'i') };
        if (topic) query.topic = { $regex: new RegExp(topic, 'i') };
        if (difficulty) query.difficulty = difficulty;
        if (round) query.round = round;
        if (tags) query.tags = { $in: tags.split(',') };

        const questions = await Question.find(query);
        res.status(200).json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Server error fetching questions' });
    }
};

// Get questions by company
export const getQuestionsByCompany = async (req, res) => {
    try {
        const { company } = req.params;
        const questions = await Question.find({ company: { $regex: new RegExp(company, 'i') } });
        res.status(200).json(questions);
    } catch (error) {
        console.error(`Error fetching questions for company ${req.params.company}:`, error);
        res.status(500).json({ error: 'Server error fetching questions' });
    }
};

// Get questions by topic
export const getQuestionsByTopic = async (req, res) => {
    try {
        const { topic } = req.params;
        const questions = await Question.find({ topic: { $regex: new RegExp(topic, 'i') } });
        res.status(200).json(questions);
    } catch (error) {
        console.error(`Error fetching questions for topic ${req.params.topic}:`, error);
        res.status(500).json({ error: 'Server error fetching questions' });
    }
};

// Insert mock questions (Optional utility for setup)
export const seedQuestions = async (req, res) => {
    try {
        const mockQuestions = [
            {
                company: "Amazon",
                role: "Software Engineer",
                round: "Technical",
                topic: "OOP",
                difficulty: "Medium",
                question: "Explain polymorphism with a real-world example.",
                solution: "Polymorphism means 'many forms'. It allows objects of different classes to be treated as objects of a common superclass.",
                explanation: "In Java, this is achieved through method overriding and method overloading.",
                tags: ["oop", "polymorphism", "java"]
            },
            {
                company: "Google",
                role: "Software Engineer",
                round: "Coding",
                topic: "DSA",
                difficulty: "Hard",
                question: "Find the median of two sorted arrays.",
                solution: "Use binary search on the smaller array to find the correct partition point.",
                explanation: "Time complexity is O(log(min(m,n))) and space complexity is O(1).",
                tags: ["dsa", "arrays", "binary-search"]
            }
            // Add more seed questions as necessary
        ];

        await Question.insertMany(mockQuestions);
        res.status(201).json({ message: 'Mock questions inserted successfully' });
    } catch (error) {
        console.error('Error seeding questions:', error);
        res.status(500).json({ error: 'Server error seeding questions' });
    }
};
