import SentimentRecord from "../models/SentimentRecord.model.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Get sentiment trends for a city over a time period
 * @param {import('mongoose').Types.ObjectId} cityId - City ObjectId
 * @param {{ period?: '24h' | '7d' }} options - period: 24h or 7d (default 24h)
 * @returns {Promise<Object>} Trend summary
 */
export async function getSentimentTrends(cityId, options = {}) {
  const period = options.period || "24h";
  const windowMs = period === "7d" ? 7 * DAY_MS : 24 * HOUR_MS;
  const startDate = new Date(Date.now() - windowMs);

  const records = await SentimentRecord.find({
    city: cityId,
    createdAt: { $gte: startDate },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (!records.length) {
    return {
      period,
      current: null,
      summary: "No sentiment data in this period (chat messages drive sentiment).",
      averageScore: null,
      trend: null,
      direction: null,
      topicDistribution: [],
      emotionDistribution: [],
      dataPoints: 0,
    };
  }

  const scores = records.map((r) => r.score).filter((v) => v != null);
  const latest = records[records.length - 1];
  const current = {
    score: latest.score,
    emotion: latest.emotion,
    topic: latest.topic,
    confidence: latest.confidence,
    createdAt: latest.createdAt,
  };

  const avgScore = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
  const diff = current.score != null && avgScore != null ? current.score - avgScore : 0;
  let direction = "stable";
  if (diff <= -0.1) direction = "declining";
  else if (diff >= 0.1) direction = "improving";

  const topicCounts = {};
  const emotionCounts = {};
  records.forEach((r) => {
    const t = r.topic || "other";
    topicCounts[t] = (topicCounts[t] || 0) + 1;
    const e = r.emotion || "neutral";
    emotionCounts[e] = (emotionCounts[e] || 0) + 1;
  });

  const topicDistribution = Object.entries(topicCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / records.length) * 100),
  }));

  const emotionDistribution = Object.entries(emotionCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / records.length) * 100),
  }));

  const summary =
    direction === "improving"
      ? "Public sentiment has improved compared to the period average."
      : direction === "declining"
        ? "Public sentiment has declined compared to the period average."
        : "Public sentiment is stable compared to the period average.";

  // Time-bucketed series for line chart (by hour for 24h, by day for 7d)
  const bucketMs = period === "7d" ? DAY_MS : HOUR_MS;
  const buckets = {};
  records.forEach((r) => {
    const t = new Date(r.createdAt).getTime();
    const key = Math.floor(t / bucketMs) * bucketMs;
    if (!buckets[key]) buckets[key] = { sum: 0, count: 0 };
    buckets[key].sum += r.score;
    buckets[key].count += 1;
  });
  const timeSeries = Object.entries(buckets)
    .map(([k, v]) => ({
      time: Number(k),
      averageScore: Math.round((v.sum / v.count) * 100) / 100,
      count: v.count,
    }))
    .sort((a, b) => a.time - b.time);

  return {
    period,
    current,
    summary,
    averageScore: avgScore != null ? Math.round(avgScore * 100) / 100 : null,
    trend: {
      direction,
      changeFromAverage: avgScore != null ? Math.round(diff * 100) / 100 : null,
    },
    direction,
    topicDistribution,
    emotionDistribution,
    timeSeries,
    dataPoints: records.length,
  };
}
