import cron from 'node-cron';
import City from '../models/city.model.js';
import { fetchAndStoreAQIForCity } from '../services/aqi.service.js'; // your existing fetch logic

// Runs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[AQI Poller] Running at', new Date().toISOString());
  
  try {
    const cities = await City.find({});
    
    for (const city of cities) {
      try {
        await fetchAndStoreAQIForCity(city.name);
        console.log(`[AQI Poller] Updated AQI for ${city.name}`);
      } catch (err) {
        console.error(`[AQI Poller] Failed for ${city.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[AQI Poller] DB error:', err.message);
  }
});