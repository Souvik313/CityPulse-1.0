import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import './About.css';

const About = () => {
    return (
        <>
        <Header />
        <div className="about-container">
            <h2>About CityPulse</h2>

            <h3>CityPulse is a cutting-edge Urban Analytics Dashboard designed to provide real-time insights into various aspects of city life. By integrating live data streams such as Air Quality Index (AQI), weather conditions, traffic patterns, and public sentiment, CityPulse offers a comprehensive view of urban dynamics for both citizens and public officials.</h3>
            <h3>Our mission is to empower communities with actionable information, enabling them to make informed decisions that enhance their quality of life. Whether you're a resident looking to stay updated on local conditions or a city planner aiming to optimize urban infrastructure, CityPulse is your go-to platform for real-time urban analytics.</h3>

            <h3>Key features:</h3>
            <ul><li>Real-time Air Quality Index (AQI) monitoring</li><li>Live weather updates</li><li>Traffic pattern analysis</li><li>Public sentiment tracking</li></ul>
            <h3>How it works?</h3>
            <ul>
                <li>Aggregates real-time city data from multiple public APIs</li>
                <li>Visualise key metrics through graphs and traffic charts</li>
                <li>Provide AI-based predictions for next-hour AQI and traffic levels</li>
                <li>Offers a simple, innovative dashboard type UI for quick insights and decision-making</li>
            </ul>
            <h3>Join us in making cities smarter and more livable with CityPulse!</h3>
        </div>
        <Footer />
        </>
    )
}

export default About;