import mongoose from 'mongoose';
import { initTimeSeriesCollections } from '../config/init.js';
import { DB_URI , NODE_ENV } from '../config/env.js';

if(!DB_URI){
    throw new Error("Please define the MONGODB_URI inside env.<production/local>.local");
}

const connectToDatabase = async () => {
    try{
        await mongoose.connect(DB_URI);

        console.log(`Connected to database in ${NODE_ENV} mode`);
        await initTimeSeriesCollections();
    } catch(error) {
        console.error("Failed to connect to database" , error);

        process.exit(1);
    }
}

export default connectToDatabase;
