const mongoose = require('mongoose');
require('dotenv').config();
const Interview = require('./models/Interview');

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find an existing interview that the UI might have just made
        const intv = await Interview.findOne().sort({ createdAt: -1 });
        if (!intv) {
            console.log("No interview found!");
            process.exit(0);
        }

        console.log("Latest Interview Phase:", intv.interviewPhase);
        const questionsArray = intv.interviewPhase === 'technical' ? intv.technicalResults : intv.hrResults;
        console.log("Total questions in array:", questionsArray.length);

        if (questionsArray.length > 0) {
            const firstQuestion = questionsArray[0];
            const qIdStr = firstQuestion._id.toString();
            console.log("First question _id (string):", qIdStr);

            // Test Mongoose .id()
            const foundQuestion = intv.technicalResults.id(qIdStr) || intv.hrResults.id(qIdStr);
            console.log("Mongoose .id() found it?", !!foundQuestion);
        }

    } catch (err) {
        console.error("Test error:", err);
    } finally {
        process.exit(0);
    }
}

runTest();
