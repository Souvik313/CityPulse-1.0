import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell,
} from "recharts";
import useTrafficTrends from "../../hooks/useTrafficTrends.js";
import "./TrafficTrendsModal.css";

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDelay = (seconds) => {
  if (seconds >= 60) return `${Math.round(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const CONGESTION_COLORS = { low: "#22c55e", moderate: "#f59e0b", high: "#ef4444" };
const SEVERITY_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt-tooltip">
      <p className="tt-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}{p.unit ?? ""}</strong>
        </p>
      ))}
    </div>
  );
};

export default function TrafficTrendsModal({ cityName, onClose }) {
  const [period, setPeriod] = useState("24h");
  const { trends, history, loading, error } = useTrafficTrends(cityName, {
    period,
    withHistory: true,
  });

  const timeSeries = history?.timeSeries ?? [];
  const rankedRoads = history?.rankedRoads ?? [];
  const levelCounts = history?.levelCounts ?? { low: 0, moderate: 0, high: 0 };

  const speedChartData = timeSeries.map((r) => ({
    time: formatTime(r.recordedAt),
    fullTime: r.recordedAt,
    avgSpeed: r.avgSpeed,
    freeFlow: r.freeFlowSpeed,
  }));

  const ttiChartData = timeSeries.map((r) => ({
    time: formatTime(r.recordedAt),
    fullTime: r.recordedAt,
    tti: r.travelTimeIndex,
    speedLoss: r.speedLossPct,
  }));

  const delayChartData = timeSeries.map((r) => ({
    time: formatTime(r.recordedAt),
    fullTime: r.recordedAt,
    maxDelay: r.maxDelay,
    avgDelay: r.avgDelay,
  }));

  const donutData = Object.entries(levelCounts).map(([level, count]) => ({
    level,
    count,
  }));

  const totalRecords = donutData.reduce((s, d) => s + d.count, 0);

  // Latest record stats
  const latest = timeSeries[timeSeries.length - 1];

  return (
    <div className="tt-overlay" onClick={onClose}>
      <div className="tt-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <header className="tt-header">
          <div className="tt-header-left">
            <span className="tt-header-icon">🚦</span>
            <div>
              <h2 className="tt-title">Traffic Trends</h2>
              <p className="tt-subtitle">{cityName || "City"}</p>
            </div>
          </div>
          <div className="tt-header-right">
            <div className="tt-period-toggle">
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
            <button className="tt-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </header>

        <div className="tt-body">
          {loading && <div className="tt-loading"><span className="tt-spinner" />Loading traffic data…</div>}
          {error && <div className="tt-error">⚠ {error}</div>}

          {!loading && !error && (
            <>
              {/* Stat Cards */}
              {latest && (
                <section className="tt-cards">
                  <div className="tt-card">
                    <span className="tt-card-label">Congestion</span>
                    <span
                      className="tt-card-value"
                      style={{ color: CONGESTION_COLORS[latest.congestionLevel] }}
                    >
                      {latest.congestionLevel?.toUpperCase() ?? "—"}
                    </span>
                    <span className="tt-card-sub">TTI: {latest.travelTimeIndex}</span>
                  </div>
                  <div className="tt-card">
                    <span className="tt-card-label">Avg Speed</span>
                    <span className="tt-card-value">{latest.avgSpeed ?? "—"} <small>km/h</small></span>
                    <span className="tt-card-sub">Freeflow: {latest.freeFlowSpeed} km/h</span>
                  </div>
                  <div className="tt-card">
                    <span className="tt-card-label">Speed Loss</span>
                    <span
                      className="tt-card-value"
                      style={{ color: latest.speedLossPct > 20 ? "#ef4444" : latest.speedLossPct > 10 ? "#f59e0b" : "#22c55e" }}
                    >
                      {latest.speedLossPct ?? 0}%
                    </span>
                    <span className="tt-card-sub">vs freeflow</span>
                  </div>
                  <div className="tt-card">
                    <span className="tt-card-label">Max Delay</span>
                    <span className="tt-card-value">{formatDelay(latest.maxDelay)}</span>
                    <span className="tt-card-sub">Avg: {formatDelay(latest.avgDelay)}</span>
                  </div>
                  <div className="tt-card">
                    <span className="tt-card-label">Road Closures</span>
                    <span
                      className="tt-card-value"
                      style={{ color: latest.roadClosureCount > 0 ? "#ef4444" : "#22c55e" }}
                    >
                      {latest.roadClosureCount ?? 0}
                    </span>
                    <span className="tt-card-sub">Incidents: {latest.incidentCount}</span>
                  </div>
                  <div className="tt-card">
                    <span className="tt-card-label">Confidence</span>
                    <span className="tt-card-value">{latest.confidence ?? "—"}%</span>
                    <span className="tt-card-sub">Data quality</span>
                  </div>
                </section>
              )}

              {timeSeries.length > 0 && (
                <>
                  {/* Speed Chart */}
                  <section className="tt-chart-section">
                    <h3 className="tt-chart-title">Average Speed vs Freeflow Speed</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={speedChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} unit=" km/h" />
                        <Tooltip
                          content={<CustomTooltip />}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.fullTime ? formatDate(payload[0].payload.fullTime) : ""
                          }
                          formatter={(v, name) => [`${v} km/h`, name === "avgSpeed" ? "Avg Speed" : "Freeflow"]}
                        />
                        <Legend formatter={(v) => v === "avgSpeed" ? "Avg Speed" : "Freeflow Speed"} />
                        <Line
                          type="monotone"
                          dataKey="avgSpeed"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="avgSpeed"
                        />
                        <Line
                          type="monotone"
                          dataKey="freeFlow"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="freeFlow"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </section>

                  {/* TTI Chart */}
                  <section className="tt-chart-section">
                    <h3 className="tt-chart-title">Travel Time Index Over Time</h3>
                    <p className="tt-chart-desc">Values above 1.0 indicate slower than freeflow conditions</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={ttiChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                        <Tooltip
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.fullTime ? formatDate(payload[0].payload.fullTime) : ""
                          }
                          formatter={(v, name) => [v, name === "tti" ? "TTI" : "Speed Loss %"]}
                        />
                        <Legend formatter={(v) => v === "tti" ? "Travel Time Index" : "Speed Loss %"} />
                        {/* Reference line at 1.0 — above this = congested */}
                        <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Freeflow baseline", fontSize: 10, fill: "#ef4444" }} />
                        <Line
                          type="monotone"
                          dataKey="tti"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={false}
                          name="tti"
                        />
                        <Line
                          type="monotone"
                          dataKey="speedLoss"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                          name="speedLoss"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </section>

                  {/* Delay Chart */}
                  <section className="tt-chart-section">
                    <h3 className="tt-chart-title">Hotspot Delays Over Time</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={delayChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} unit="s" />
                        <Tooltip
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.fullTime ? formatDate(payload[0].payload.fullTime) : ""
                          }
                          formatter={(v) => [`${v}s`, ""]}
                        />
                        <Legend formatter={(v) => v === "maxDelay" ? "Max Delay" : "Avg Delay"} />
                        <Line
                          type="monotone"
                          dataKey="maxDelay"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={false}
                          name="maxDelay"
                        />
                        <Line
                          type="monotone"
                          dataKey="avgDelay"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={false}
                          name="avgDelay"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </section>
                </>
              )}

              {/* Bottom row: ranked roads + congestion distribution */}
              <div className="tt-bottom-row">

                {/* Top Delayed Roads */}
                {rankedRoads.length > 0 && (
                  <section className="tt-chart-section tt-ranked-roads">
                    <h3 className="tt-chart-title">Top Delayed Roads</h3>
                    <p className="tt-chart-desc">Average delay across all recorded hotspot appearances</p>
                    <ResponsiveContainer width="100%" height={Math.max(200, rankedRoads.length * 36)}>
                      <BarChart
                        data={rankedRoads}
                        layout="vertical"
                        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} unit="s" />
                        <YAxis
                          type="category"
                          dataKey="roadName"
                          tick={{ fontSize: 11 }}
                          width={180}
                        />
                        <Tooltip
                          formatter={(v, name) => [
                            name === "avgDelay" ? formatDelay(v) : `${v}x`,
                            name === "avgDelay" ? "Avg Delay" : "Appearances"
                          ]}
                        />
                        <Bar dataKey="avgDelay" name="avgDelay" radius={[0, 4, 4, 0]}>
                          {rankedRoads.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SEVERITY_COLORS[Math.min(index, SEVERITY_COLORS.length - 1)]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {/* Congestion Distribution */}
                {totalRecords > 0 && (
                  <section className="tt-chart-section tt-distribution">
                    <h3 className="tt-chart-title">Congestion Distribution</h3>
                    <p className="tt-chart-desc">Breakdown across {totalRecords} recorded snapshots</p>
                    <div className="tt-donut-wrapper">
                      <div className="tt-donut">
                        {donutData.map((d) => (
                          <div key={d.level} className="tt-donut-segment">
                            <span
                              className="tt-donut-dot"
                              style={{ background: CONGESTION_COLORS[d.level] }}
                            />
                            <span className="tt-donut-level">{d.level}</span>
                            <span className="tt-donut-count">{d.count}</span>
                            <span className="tt-donut-pct">
                              {totalRecords > 0
                                ? `${((d.count / totalRecords) * 100).toFixed(1)}%`
                                : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Visual bar representation */}
                      <div className="tt-level-bars">
                        {donutData.map((d) => (
                          <div key={d.level} className="tt-level-bar-row">
                            <span className="tt-level-bar-label">{d.level}</span>
                            <div className="tt-level-bar-track">
                              <div
                                className="tt-level-bar-fill"
                                style={{
                                  width: totalRecords > 0 ? `${(d.count / totalRecords) * 100}%` : "0%",
                                  background: CONGESTION_COLORS[d.level]
                                }}
                              />
                            </div>
                            <span className="tt-level-bar-value">
                              {totalRecords > 0 ? `${((d.count / totalRecords) * 100).toFixed(1)}%` : "0%"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {timeSeries.length === 0 && !loading && (
                <p className="tt-empty">No traffic data available for this period.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}