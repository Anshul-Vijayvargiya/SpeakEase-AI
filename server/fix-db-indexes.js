import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const collection = mongoose.connection.collection('users');
    
    // List indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    if (indexes.some(i => i.name === 'firebaseUid_1')) {
      console.log('Dropping firebaseUid_1 index...');
      await collection.dropIndex('firebaseUid_1');
      console.log('Index dropped successfully');
    } else {
      console.log('firebaseUid_1 index not found');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error dropping index:', err);
    process.exit(1);
  }
}

dropIndexes();
