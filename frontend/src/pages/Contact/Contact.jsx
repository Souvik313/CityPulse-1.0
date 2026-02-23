import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Contact.css';
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import axios from 'axios';

const Contact = () => {
    const [formData , setFormData] = useState({
        email: "",
        city: "",
        message: ""
    });
    const [sendStatus, setSendStatus] = useState(false);
    const navigate = useNavigate();

    return (
        <>
        <Header />
        <div className="contact-container">
            <h2>Contact Us</h2>
            <h3>If you have any questions, feedback, or need assistance, feel free to reach out to us!</h3>
            <br />
            <label htmlFor="email" className="email-label"></label>
            <input 
                type="email" 
                className="email-input"
                id="email" 
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter your email" />

            <label htmlFor="city"></label>
            <input 
                type="text" 
                className="city-input"
                id="city" 
                name="city" 
                value = {formData.city}
                onChange = {(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Enter your city" />

            <label htmlFor="message"></label>
            <input 
                type="text" 
                className="message-input"
                id="message" 
                name="message" 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Enter your message" />

            <button className="submit-button" onClick={() => {
                                                        setSendStatus(true);
                                                        setTimeout(() => {
                                                            alert("Message sent! We will get back to you soon.")
                                                            setFormData({
                                                                email: "",
                                                                city: "",
                                                                message: ""
                                                            });
                                                            setSendStatus(false);
                                                        },2000);
                                                    }}>{sendStatus ? "Sending..." : "Submit"}</button>
        </div>
        <Footer />
        </>
    )
}

export default Contact;