import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
import { useFetchUser } from "../../hooks/useFetchUser.js";
import Header from "../../components/Header/Header.jsx";
import './GetStarted.css';

const GetStarted = () => {
    const navigate = useNavigate();
    const [city , setCity] = useState("");
    const {user , error , loading} = useFetchUser();

    const handleOwnCityInput = async(e) => {
        e.preventDefault();
        try{
            const ownCity = user?.city.name;
            setCity(ownCity);
        } catch(error) {
            alert("Error in proceeding");
            console.error(error);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            const trimmed = city?.trim();
            if (!trimmed) {
                alert("Please enter a city name to explore.");
                return;
            }
            localStorage.setItem("lastCity", trimmed);
            navigate(`/dashboard?city=${encodeURIComponent(trimmed)}`);
        } catch (err) {
            console.error(err);
            alert("Unable to proceed to the dashboard");
        }
    }
    if(loading) return <div>Loading...</div>
    if(error) return <div>Error: {error}</div>

    return(
        <>
        <Header />
        <div className="get-started-container">
            <h2>Which city do you want to explore?</h2>
            <form action="" className="get-started-form" onSubmit={handleSubmit}>
                <label htmlFor="city">Enter any city name to get started</label>
                <input 
                    type="text"
                    id="city"
                    className="city-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="" />
                <button type="submit" className="explore-btn">Explore</button>
            </form>
            <div className="explore-own-city" onClick={(e) => handleOwnCityInput(e)}><a>I want to explore my own city</a></div>
        </div>
        </>
    )
}

export default GetStarted;