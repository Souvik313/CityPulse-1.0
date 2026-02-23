import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import useSentimentTrends from "../../hooks/useSentimentTrends.js";
import "./SentimentTrendsModal.css";

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (ts) => {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
  });
};

const TOPIC_COLORS = { traffic: "#3b82f6", pollution: "#ef4444", weather: "#22c55e", safety: "#f59e0b", other: "#8b5cf6" };
const EMOTION_COLORS = { happy: "#22c55e", neutral: "#94a3b8", anger: "#ef4444", sad: "#6366f1" };

export default function SentimentTrendsModal({ cityName, onClose }) {
  const [period, setPeriod] = useState("24h");
  const { trends, loading, error } = useSentimentTrends(cityName, { period });

  const chartData =
    trends?.timeSeries?.map((p) => ({
      time: formatTime(p.time),
      fullTime: p.time,
      score: p.averageScore,
      count: p.count,
    })) ?? [];

  return (
    <div className="sentiment-trends-overlay" onClick={onClose}>
      <div className="sentiment-trends-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sentiment-trends-header">
          <h2>💬 Sentiment Trends — {cityName || "City"}</h2>
          <div className="sentiment-trends-period">
            <span>Period:</span>
            <button
              className={period === "24h" ? "active" : ""}
              onClick={() => setPeriod("24h")}
            >
              24 hours
            </button>
            <button
              className={period === "7d" ? "active" : ""}
              onClick={() => setPeriod("7d")}
            >
              7 days
            </button>
          </div>
          <button type="button" className="sentiment-trends-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="sentiment-trends-body">
          {loading && (
            <div className="sentiment-trends-loading">Loading sentiment trends…</div>
          )}
          {error && (
            <div className="sentiment-trends-error">⚠ {error}</div>
          )}

          {!loading && !error && trends && (
            <>
              <p className="sentiment-trends-hint">
                Sentiment is derived from chatbot messages. More chat activity in this city improves the data.
              </p>
              <section className="sentiment-trends-cards">
                <div className="trend-card current">
                  <span className="label">Latest score</span>
                  <span className="value">{trends.current?.score ?? "—"}</span>
                  <span className="sub">{trends.current?.emotion ?? ""} · {trends.current?.topic ?? ""}</span>
                </div>
                <div className={`trend-card direction ${trends.direction}`}>
                  <span className="label">Trend</span>
                  <span className="value">{trends.direction ?? "—"}</span>
                  <span className="sub">{trends.summary}</span>
                </div>
                <div className="trend-card">
                  <span className="label">Period average</span>
                  <span className="value">{trends.averageScore ?? "—"}</span>
                  <span className="sub">{trends.dataPoints} messages</span>
                </div>
              </section>

              {chartData.length > 0 && (
                <section className="sentiment-trends-chart">
                  <h3>Sentiment score over time</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                      <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullTime
                            ? formatDate(payload[0].payload.fullTime)
                            : ""
                        }
                        formatter={(value) => [value, "Score"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        name="Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </section>
              )}

              {(trends.topicDistribution?.length > 0 || trends.emotionDistribution?.length > 0) && (
                <section className="sentiment-trends-bars">
                  {trends.topicDistribution?.length > 0 && (
                    <div className="sentiment-bar-block">
                      <h3>Topics</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={trends.topicDistribution}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 60, bottom: 4 }}
                        >
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                          <Bar dataKey="percentage" radius={4}>
                            {trends.topicDistribution.map((entry, i) => (
                              <Cell key={entry.name} fill={TOPIC_COLORS[entry.name] || "#94a3b8"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {trends.emotionDistribution?.length > 0 && (
                    <div className="sentiment-bar-block">
                      <h3>Emotions</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={trends.emotionDistribution}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 56, bottom: 4 }}
                        >
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" width={52} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                          <Bar dataKey="percentage" radius={4}>
                            {trends.emotionDistribution.map((entry, i) => (
                              <Cell key={entry.name} fill={EMOTION_COLORS[entry.name] || "#94a3b8"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              )}

              {!loading && trends && trends.dataPoints === 0 && (
                <p className="sentiment-trends-empty">No sentiment data in this period. Use the chatbot to generate feedback for this city.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
