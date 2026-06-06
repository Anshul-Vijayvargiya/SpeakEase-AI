import mongoose from 'mongoose';
import './env.js';

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.model('User', UserSchema);
        const users = await User.find().limit(5);
        console.log("Users:", users.map(u => ({ id: u._id, email: u.email, name: u.name, passwordHash: u.password })));
    } catch (err) {
        console.error("List users error:", err);
    } finally {
        process.exit(0);
    }
}
test();
