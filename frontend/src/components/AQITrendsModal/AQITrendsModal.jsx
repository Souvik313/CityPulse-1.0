import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import useAQITrends from "../../hooks/useAQITrends.js";
import "./AQITrendsModal.css";

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AQITrendsModal({ cityName, onClose }) {
  const [period, setPeriod] = useState("24h");
  const { trends, history, loading, error } = useAQITrends(cityName, {
    period,
    withHistory: true,
  });
  const chartData =
    history?.map((r) => ({
      time: formatTime(r.recordedAt),
      fullTime: r.recordedAt,
      aqi: r.aqiValue,
      category: r.category,
    })) ?? [];

  const avg = trends?.average;

  return (
    <div className="aqi-trends-overlay" onClick={onClose}>
      <div className="aqi-trends-modal" onClick={(e) => e.stopPropagation()}>
        <header className="aqi-trends-header">
          <h2>🌫️ AQI Latest Trends — {cityName || "City"}</h2>
          <div className="aqi-trends-period">
            <span>Period:</span>
            <button
              className={period === "24h" ? "active" : ""}
              onClick={() => setPeriod("24h")}
            >
              24h
            </button>
            <button
              className={period === "7d" ? "active" : ""}
              onClick={() => setPeriod("7d")}
            >
              7d
            </button>
          </div>
          <button type="button" className="aqi-trends-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="aqi-trends-body">
          {loading && (
            <div className="aqi-trends-loading">Loading trends…</div>
          )}
          {error && (
            <div className="aqi-trends-error">⚠ {error}</div>
          )}

          {!loading && !error && trends && (
            <>
              <section className="aqi-trends-cards">
                <div className="trend-card current">
                  <span className="label">Current AQI</span>
                  <span className="value">{trends.current?.aqi ?? "—"}</span>
                  <span className="sub">{trends.current?.category ?? ""}</span>
                </div>
                <div className={`trend-card direction ${trends.direction}`}>
                  <span className="label">Trend</span>
                  <span className="value">{trends.direction ?? "—"}</span>
                  <span className="sub">{trends.summary}</span>
                </div>
                <div className="trend-card">
                  <span className="label">Period average</span>
                  <span className="value">{trends.average ?? "—"}</span>
                  <span className="sub">Min: {trends.min ?? "—"} · Max: {trends.max ?? "—"}</span>
                </div>
                <div className="trend-card">
                  <span className="label">Dominant pollutant</span>
                  <span className="value">{trends.dominantPollutant ?? "—"}</span>
                </div>
                {trends.peakHour != null && (
                  <div className="trend-card">
                    <span className="label">Peak hour (UTC)</span>
                    <span className="value">{trends.peakHour.hour}:00</span>
                    <span className="sub">Avg AQI: {trends.peakHour.averageAQI}</span>
                  </div>
                )}
              </section>

              {chartData.length > 0 && (
                <section className="aqi-trends-chart">
                  <h3>AQI over time</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis domain={[0, "auto"]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullTime
                            ? formatDate(payload[0].payload.fullTime)
                            : ""
                        }
                        formatter={(value) => [`${value} AQI`, "AQI"]}
                      />
                      {typeof avg === "number" && (
                        <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="4 4" />
                      )}
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        name="AQI"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </section>
              )}

              {!loading && trends && !trends.current && (
                <p className="aqi-trends-empty">No AQI data in this period.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
