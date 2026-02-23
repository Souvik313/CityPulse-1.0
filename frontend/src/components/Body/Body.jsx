import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Body.css';
import axios from 'axios';

const Body = () => {
    const navigate = useNavigate();
    return(
        <div className="body-container">
            <h2>Welcome to CityPulse!</h2>
            <h3>CityPulse is a real-time Urban Analytics Dashboard that integrates live data such as AQI, weather , traffic and public sentiment into one unified platform for citizens and public officials.</h3>

            <h3>Explore the city like never before with CityPulse!</h3>
            <br />
            <br />
            <button className="learn-more" onClick={() => navigate("/about")}>Learn More</button>
            <button className="get-started" onClick={() => {!localStorage.getItem("token") ? navigate("/register") :
                                                                                            navigate("/get-started")
            }}>Get Started</button>

        </div>
    )
}

export default Body;