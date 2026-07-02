import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAptitudeQuestions } from '../services/aptitudeGenerator.js';
import QuestionBank from '../models/QuestionBank.js';

// Setup env variables since we're running as a script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TOPICS = [
  "Number System", "Profit & Loss", "Time & Work",
  "Speed & Distance", "Percentage", "Ratio & Proportion",
  "Average", "Simple & Compound Interest", 
  "Permutation & Combination", "Probability",
  "Series Completion", "Blood Relations", "Direction Sense",
  "Coding-Decoding", "Syllogism", "Calendar & Clocks",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error('MONGODB_URI is not defined in .env');

    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB.');

    console.log('Starting Question Bank Seeding...');

    for (const topic of TOPICS) {
      for (const difficulty of DIFFICULTIES) {
        console.log(`\nGenerating: ${topic} - ${difficulty}`);
        
        // We'll generate 20 questions for each combination.
        try {
          const questions = await generateAptitudeQuestions([topic], difficulty, 20);

          await QuestionBank.findOneAndUpdate(
            { topic, difficulty },
            { questions, createdAt: new Date(), usageCount: 0 },
            { upsert: true, new: true }
          );

          console.log(`Successfully generated and saved ${questions.length} questions for ${topic} - ${difficulty}`);
        } catch (err) {
          console.error(`Failed to generate for ${topic} - ${difficulty}:`, err.message);
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    console.log("\n✅ Question bank seeded successfully!");
  } catch (err) {
    console.error('Fatal Error seeding database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

seedDatabase();
