import mongoose from 'mongoose';
import './env.js';
import Interview from './models/Interview.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const latest = await Interview.findOne().sort({ createdAt: -1 });
        console.log("Latest interview:", latest ? latest._id : 'None');
        if (latest && latest.technicalResults.length > 0) {
            console.log("First question _id:", latest.technicalResults[0]._id);
        } else if (latest && latest.hrResults.length > 0) {
            console.log("First hr question _id:", latest.hrResults[0]._id);
        }
    } catch (err) {
        console.error("Test error:", err);
    } finally {
        process.exit(0);
    }
}
test();
