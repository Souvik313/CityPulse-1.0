import AQIData from "../models/AQI.model.js";
import WeatherData from "../models/WeatherData.model.js";
import TrafficData from "../models/TrafficData.model.js";
import SentimentRecord from "../models/SentimentRecord.model.js";

/**
 * Main CityPulse aggregation service
 */
export const generateCityPulse = async (city) => {
  // Fetch latest records in parallel
  const [
    latestAQI,
    latestWeather,
    latestTraffic,
    sentimentStats
  ] = await Promise.all([
    AQIData.findOne({ city }).sort({ recordedAt: -1 }),
    WeatherData.findOne({ city }).sort({ recordedAt: -1 }),
    TrafficData.findOne({ city }).sort({ recordedAt: -1 }),
    aggregateRecentSentiment(city)
  ]);

  return {
    city,
    timestamp: new Date(),
    airQuality: latestAQI
      ? {
          aqi: latestAQI.aqi,
          category: latestAQI.category
        }
      : null,
    weather: latestWeather
      ? {
          temperature: latestWeather.temperature,
          condition: latestWeather.weatherCondition,
          humidity: latestWeather.humidity
        }
      : null,
    traffic: latestTraffic
      ? {
          congestionLevel: latestTraffic.congestionLevel,
          averageSpeed: latestTraffic.averageSpeed
        }
      : null,
    publicSentiment: sentimentStats,
    pulseScore: calculatePulseScore({
      aqi: latestAQI,
      traffic: latestTraffic,
      weather: latestWeather,
      sentiment: sentimentStats
    })
  };
};

/**
 * Aggregate sentiment for last 1 hour
 */
const aggregateRecentSentiment = async (city) => {
  const result = await SentimentRecord.aggregate([
    {
      $match: {
        city,
        createdAt: {
          $gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: "$emotion",
        count: { $sum: 1 },
        avgScore: { $avg: "$score" }
      }
    }
  ]);

  return result;
};

/**
 * Final CityPulse scoring logic (0–100)
 */
const calculatePulseScore = ({ aqi, traffic, weather, sentiment }) => {
  let score = 100;

  // AQI impact
  if (aqi?.aqi) {
    if (aqi.aqi > 300) score -= 30;
    else if (aqi.aqi > 200) score -= 20;
    else if (aqi.aqi > 100) score -= 10;
  }

  // Traffic impact
  if (traffic?.congestionLevel === "Severe") score -= 20;
  else if (traffic?.congestionLevel === "High") score -= 15;
  else if (traffic?.congestionLevel === "Moderate") score -= 8;

  // Weather discomfort
  if (weather?.temperature > 40) score -= 10;
  if (weather?.humidity > 80) score -= 5;

  // Sentiment impact
  const negativeEmotion = sentiment?.find(
    (s) => ["anger", "sad", "frustrated"].includes(s._id)
  );
  if (negativeEmotion?.count > 10) score -= 10;

  return Math.max(score, 0);
};
