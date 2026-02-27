import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useCityDashboard from "../../hooks/useCityDashboard.js";
import Header from "../../components/Header/Header.jsx";
import { formatTimeAgo } from "../../hooks/formatTime.jsx";
import dashboard_icon from '../../assets/smart-city.png';
import haze_icon from '../../assets/haze.png';
import axios from "axios";
import AQITrendsModal from "../../components/AQITrendsModal/AQITrendsModal.jsx";
import WeatherTrendsModal from "../../components/WeatherTrendsModal/WeatherTrendsModal.jsx";
import TrafficTrendsModal from "../../components/TrafficTrendsModal/TrafficTrendsModal.jsx";
import SentimentTrendsModal from "../../components/SentimentTrendsModal/SentimentTrendsModal.jsx";
import ChatbotIcon from '../../assets/ChatbotIcon.svg';
import "./Dashboard.css";
import Chat from "../../components/Chat/Chat.jsx";
const API_URL = "http://localhost:5000";

export default function Dashboard() {
  const [inputCity, setInputCity] = useState("");
  const [selectedCity , setSelectedCity] = useState(null);
  const [showHotspotsModal , setShowHotspotsModal]  = useState(false);
  const [showAqiTrendsModal, setShowAqiTrendsModal] = useState(false);
  const [showWeatherTrendsModal, setShowWeatherTrendsModal] = useState(false);
  const [showTrafficTrendsModal , setShowTrafficTrendsModal] = useState(false);
  const [showSentimentTrendsModal, setShowSentimentTrendsModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [darkMode , setDarkMode] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const cityName = selectedCity?.name;

  useEffect(() => {
    const header = document.querySelector(".dashboard-header");

    const onScroll = () => {
      if (window.scrollY > 10) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      // cleanup: remove dark class when leaving dashboard
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const fetchCityDetails = async(cityName) => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/city/search?city=${encodeURIComponent(cityName)}` ,
      {
        validateStatus: (status) => status === 200 || status === 404
      });


      if(res.data.success){
        setSelectedCity(res.data.city);
        setInputCity(cityName);
        localStorage.setItem("lastCity" , cityName);
      }
    } catch (error) {
      console.log(error.message);
      alert(`Failed to fetch details for city: ${cityName}`);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qCity = params.get("city");
    if (qCity) {
      fetchCityDetails(qCity);
    } 
  }, [location.search]);

  const {
    aqi,
    weather,
    traffic,
    refreshAll,
    refreshAqi,
    refreshWeather,
    refreshTraffic,
    globalLoading,
  } = useCityDashboard(cityName, { pollingInterval: 0, enabled: Boolean(cityName) });

  // useEffect(() => {
  //   console.log("AQI FULL STATE:", aqi);
  // }, [aqi]);

  useEffect(() => {
    if (showHotspotsModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => document.body.classList.remove("modal-open");
  }, [showHotspotsModal]);


  const submitCity = async(e) => {
    e.preventDefault();
    const cleaned = inputCity.trim();
    if (!cleaned) return;
    try{
        await axios.post(`${API_URL}/api/v1/city/` , {city : cleaned} ,
      {
        validateStatus: (status) => status === 201 || status === 409
      });
        navigate(`/dashboard?city=${encodeURIComponent(cleaned)}`);
    } catch(error) {
      console.log(error.message);
      alert(`Failed to display dashboard for ${cleaned}`);
    } 
  };

  const aqiBadge = (category) => {
    switch (category?.toLowerCase()) {
      case "good": return <div>🍃 {category}</div>
      case "moderate": return <div>😐 {category}</div>
      case "unhealthy": return <div>😷 {category}</div>
      case "hazardous": return <div>☠️ {category}</div>
      default: return <div>🌫️ {category}</div>
    }
  };

  const secToMin = (seconds) => {
    if (typeof seconds !== "number" || seconds < 0) return "—";
    return (seconds / 60).toFixed(1);
  }

  const openCityMap = () => {
    if(!selectedCity) return;

    const {latitude , longitude} = selectedCity;

    window.open(
      `https://www.google.com/maps?q=${latitude},${longitude}&z=12`,
      "_blank"
    );
  }

  return (
    <>
      <div className="dashboard-page">
        <header className="dashboard-header">
          <h1>
            <img src={dashboard_icon} alt="" className="dashboard-icon"/>
            CityPulse Dashboard
          </h1>
          
          {/* <button
            className="theme-toggle"
            onClick={() => {
              setDarkMode(prev => {
                document.documentElement.classList.toggle('dark', !prev);
                return !prev;
              }}
            }
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button> */}
          <form onSubmit={submitCity} className="city-form">
            <input
              value={inputCity}
              onChange={(e) => setInputCity(e.target.value)}
              placeholder="Enter city name (e.g., Lagos)"
              aria-label="City name"
              className="city-input"
            />
            <button type="submit" className="btn-primary">
              Load
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setInputCity("");
              }}
            >
              Clear
            </button>
          </form>
          <button
            className="theme-toggle"
            onClick={() => {
              setDarkMode(prev => {
                document.documentElement.classList.toggle('dark', !prev);
                return !prev;
              })}}
            aria-label="Toggle dark mode"
          >
                {darkMode ? (     
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
          </button>
          <button
            className="btn-exit"
            onClick={() => navigate("/")}
            aria-label="Exit dashboard"
          >
            Exit
          </button>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-controls">
            <div>
              Active city: <strong>{cityName || "—"}</strong>
            </div>
            <button
              onClick={refreshAll}
              disabled={!cityName}
              className="btn-refresh"
            >
              ⟳ Refresh all
            </button>
            {globalLoading && (
              <span className="loading-indicator">Loading…</span>
            )}
          </div>

          <section className="cards-grid">
            <article className="dashboard-card">
              <header className="card-header">
                <div>
                  <h2>
                    <span className="card-icon air">🌫️</span>
                    Air Quality
                  </h2>
                  <span className="card-subtitle">AQI Index</span>
                </div>

                <button
                  className="icon-button"
                  onClick={refreshAqi}
                  disabled={!cityName || aqi.loading}
                >
                  ⟳
                </button>
              </header>

              <div className="card-body">
                {aqi.loading && (
                  <div className="skeleton">Loading air quality data…</div>
                )}

                {aqi.error && <div className="error">⚠ {aqi.error}</div>}

                {aqi.data && cityName && cityName.name !== "" && (
                  <>
                    <div className="aqi-summary">
                      <div className="aqi-value">
                        <span className="value">{aqi.data.aqiValue}</span>
                        <span className="label">AQI</span>
                      </div>

                      <span
                        className={`aqi-badge ${aqi.data.category?.toLowerCase()}`}
                      >
                        {aqiBadge(aqi.data.category)}
                      </span>
                    </div>

                    <div className="pollutants-grid">
                      <div>
                        <span>PM2.5</span>
                        <strong>{aqi.data.pollutants?.pm25}</strong>
                      </div>
                      <div>
                        <span>PM10</span>
                        <strong>{aqi.data.pollutants?.pm10}</strong>
                      </div>
                      <div>
                        <span>NO₂</span>
                        <strong>{aqi.data.pollutants?.no2}</strong>
                      </div>
                      <div>
                        <span>SO₂</span>
                        <strong>{aqi.data.pollutants?.so2}</strong>
                      </div>
                      <div>
                        <span>O₃</span>
                        <strong>{aqi.data.pollutants?.o3}</strong>
                      </div>
                      <div>
                        <span>CO₂</span>
                        <strong>{aqi.data.pollutants?.co2}</strong>
                      </div>
                    </div>

                    <div className="health-impact">
                      <strong>Health Impact:</strong>
                      <p>{aqi.data.healthImpact}</p>
                    </div>

                    <div className="muted">
                      Updated {formatTimeAgo(aqi.lastUpdated)}
                    </div>

                    <button
                      className="analyze-btn"
                      disabled={aqi.loading}
                      onClick={() => setShowAqiTrendsModal(true)}
                    >
                      Analyze latest trends
                    </button>
                  </>
                )}

                {!aqi.loading && !aqi.error && !aqi.data && (
                  <div className="empty">No AQI data available.</div>
                )}
              </div>
            </article>

            <article className="card">
              <header className="card-header">
                <h2>🌤️ Weather</h2>
                <div className="card-actions">
                  <button
                    className="icon-button"
                    onClick={refreshWeather}
                    disabled={!cityName || aqi.loading}
                  >
                    ⟳
                  </button>
                </div>
              </header>
              <div className="card-body">
                {weather.loading && (
                  <div className="skeleton">Loading weather…</div>
                )}
                {weather.error && (
                  <div className="error">Weather error: {weather.error}</div>
                )}
                {weather.data && cityName && cityName.name !== "" && (
                  <>
                    <img src={haze_icon} alt="" className="weather-cond"/>
                    <div className="metric">
                      <strong>{weather.data.temperature}°C</strong>
                      <span>Temperature</span>
                    </div>

                    <div className="metric">
                      <strong>
                        {weather.data.condition?.description || "—"}
                      </strong>
                      <span>Condition</span>
                    </div>

                    <div className="metric">
                      <strong>{weather.data.humidity ?? "—"}</strong>
                      <span>Humidity</span>
                    </div>

                    <div className="metric">
                      <strong>{weather.data.wind?.speed || "—"}</strong>
                      <span>Wind speed(m/s)</span>
                    </div>

                    <div className="muted">
                      Updated {formatTimeAgo(weather.lastUpdated)}
                    </div>

                    <button
                      className="analyze-btn"
                      disabled={weather.loading}
                      onClick={() => setShowWeatherTrendsModal(true)}
                    >
                      Analyze latest trends
                    </button>
                  </>
                )}
                {!weather.loading && !weather.error && !weather.data && (
                  <div className="empty">No weather data available.</div>
                )}
              </div>
            </article>

            <article className="card">
              <header className="card-header">
                <h2>🚦Traffic</h2>
                <div className="card-actions">
                  <button
                    className="icon-button"
                    onClick={refreshTraffic}
                    disabled={!cityName || traffic.loading}
                  >
                    ⟳
                  </button>
                </div>
              </header>
              <div className="card-body">
                {traffic.loading && (
                  <div className="skeleton">Loading traffic…</div>
                )}
                {traffic.error && (
                  <div className="error">Traffic error: {traffic.error}</div>
                )}
                {traffic.data && cityName && cityName.name !== "" && (
                  <div>
                    <div>
                      <strong>Congestion:</strong>{" "}
                      {traffic.data.congestion.level}
                    </div>
                    <br />
                    <div>
                      <strong>Avg speed(km/h):</strong>{" "}
                      {traffic.data.speed.average ?? "—"}
                    </div>
                    <br />
                    <div>
                      <strong>Road closure count:</strong>{" "}
                      {traffic.data.roadClosureCount}
                    </div>
                    <br />
                    <div className="hotspots-container">
                      <strong>Hotspots:</strong>

                      {traffic.data.hotspots && traffic.data.hotspots.length > 0 ? (
                        <>
                          <div className="hotspots">
                            {traffic.data.hotspots[0].roadName} - Delay:{" "}
                            {secToMin(traffic.data.hotspots[0].delaySeconds)} min
                          </div>

                          {traffic.data.hotspots.length > 1 && (
                            <>

                                  <button
                                  disabled={traffic.loading}
                                    onClick={() => {setShowHotspotsModal(true) ; document.activeElement?.blur();}}
                                    className="show-more-btn"
                                  >
                                View All Hotspots
                              </button>
                            </>
                          )}

                          {showHotspotsModal && (
                            <div className="modal-overlay" onClick={() => setShowHotspotsModal(false)}>
                              <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <h3>Traffic Hotspots</h3>
                                <button className="close-modal" onClick={() => setShowHotspotsModal(false)} onMouseDown={(e) => e.preventDefault()}>✕</button>

                                {traffic.data.hotspots.map((hotspot, index) => (
                                  <div key={index} className="modal-hotspot">
                                    <div className="hotspot-info">
                                      <strong>{hotspot.roadName}</strong> – Delay:{" "}
                                      <span>{secToMin(hotspot.delaySeconds)} min</span>
                                    </div>

                                    <iframe
                                      title={`map-${index}`}
                                      width="100%"
                                      height="180"
                                      style={{ border: 0, borderRadius: "10px", marginTop: "8px" }}
                                      loading="lazy"
                                      allowFullScreen
                                      src={`https://www.google.com/maps?q=${hotspot.lat},${hotspot.lng}&z=16&output=embed`}
                                    /> 
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        " None"
                      )}
                    </div>
                    <br />
                    <div className="muted">
                      Updated {formatTimeAgo(traffic.lastUpdated)}
                    </div>
                    <br />
                      <button className="analyze-btn" disabled={traffic.loading} onClick={() => setShowTrafficTrendsModal(true)}>Analyze latest trends</button>
                  </div>
                  
                )}
                {!traffic.loading && !traffic.error && !traffic.data && (
                  <div className="empty">No traffic data available.</div>
                )}
              </div>
            </article>

            <article className="card">
              <header className="card-header">
                <h2>💬 Sentiment</h2>
              </header>
              <div className="card-body">
                <p className="muted">
                  Sentiment is derived from chatbot messages for this city.
                  More chat activity improves the data.
                </p>
                <button
                  className="analyze-btn"
                  disabled={!cityName}
                  onClick={() => setShowSentimentTrendsModal(true)}
                >
                  Analyze latest trends
                </button>
              </div>
            </article>
          </section>
        </main>

        {/* Chat widget for city feedback */}
        <div style={{position: 'fixed', right: 16, bottom: 16, zIndex: 60}}>
          <img src={ChatbotIcon} 
              alt="open-chat" 
              onClick={() => setIsChatOpen(prev => !prev)}
              style={{cursor : 'pointer'}}/>
              {isChatOpen && <Chat cityId={selectedCity?._id} />} 
        </div>

        <div className="view-city-map">
          <button className="explore-map" onClick={() => openCityMap()}>View on map</button>
        </div>

        {showAqiTrendsModal && cityName && (
          <AQITrendsModal
            cityName={cityName}
            onClose={() => setShowAqiTrendsModal(false)}
          />
        )}
        {showWeatherTrendsModal && cityName && (
          <WeatherTrendsModal
            cityName={cityName}
            onClose={() => setShowWeatherTrendsModal(false)}
          />
        )}
        {showTrafficTrendsModal && cityName && (
          <TrafficTrendsModal 
            cityName={cityName}
            onClose={() => setShowTrafficTrendsModal(false)}
          />
        )}
        {showSentimentTrendsModal && cityName && (
          <SentimentTrendsModal
            cityName={cityName}
            onClose={() => setShowSentimentTrendsModal(false)}
          />
        )}
      </div>
    </>
  );
}
