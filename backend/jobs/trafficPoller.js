import cron from 'node-cron';
import City from '../models/city.model.js';
import { fetchLiveTraffic } from '../services/traffic.service.js'; // your existing fetch logic

// Runs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    console.log('[Traffic Poller] Running at', new Date().toISOString());

    try {
        const cities = await City.find({});
        
        for (const city of cities) {
            try {
                await fetchLiveTraffic({ city: city.name, lat: city.latitude, lon: city.longitude });
                console.log(`[Traffic Poller] Updated traffic for ${city.name}`);
            } catch (err) {
                console.error(`[Traffic Poller] Failed for ${city.name}:`, err.message);
            }
        }
    } catch (error) {
        console.error('[Traffic Poller] DB error:', error.message);
    }
});