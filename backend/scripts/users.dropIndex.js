import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({path: resolve(__dirname, '../.env.development.local')});

const { DB_URI } = process.env;

if (!DB_URI) {
    console.error('DB_URI is not defined in environment variables');
    process.exit(1);
}

await mongoose.connect(DB_URI);
await mongoose.connection.collection('users').dropIndex('username_1');
console.log('Index dropped successfully');
process.exit(0);