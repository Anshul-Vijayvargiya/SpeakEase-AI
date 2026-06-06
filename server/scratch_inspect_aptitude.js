import mongoose from 'mongoose';
import './env.js';
import AptitudeSession from './models/AptitudeSession.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const sessions = await AptitudeSession.find().sort({ createdAt: -1 }).limit(5);
        console.log("Found sessions:", sessions.length);
        sessions.forEach((s, idx) => {
            console.log(`\n--- Session ${idx} ---`);
            console.log("ID:", s._id);
            console.log("Status:", s.status);
            console.log("Topics:", s.topics);
            console.log("Score:", s.score);
            console.log("Questions Count:", s.questions?.length);
            console.log("Answers:", s.answers);
            console.log("Results (first 1):", s.results ? s.results[0] : 'None');
        });
    } catch (err) {
        console.error("Inspect error:", err);
    } finally {
        process.exit(0);
    }
}
test();
