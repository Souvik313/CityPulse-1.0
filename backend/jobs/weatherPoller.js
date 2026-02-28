import cron from 'node-cron';
import City from '../models/city.model.js';
import { fetchAndStoreWeatherForCity } from '../services/weather.service.js'; // your existing fetch logic

//Runs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    console.log('[Weather Poller] Running at', new Date().toISOString());

    try {
        const cities = await City.find({});
        
        for (const city of cities) {
            try {
                await fetchAndStoreWeatherForCity(city.name);
                console.log(`[Weather Poller] Updated weather for ${city.name}`);
            } catch (err) {
                console.error(`[Weather Poller] Failed for ${city.name}:`, err.message);
            }
        }
    } catch (error) {
        console.error('[Weather Poller] DB error:', error.message);    
    }});