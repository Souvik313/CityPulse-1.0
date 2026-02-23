import { useState } from "react";
import './Footer.css';
import { useNavigate } from "react-router-dom";

const Footer = () => {
    return(
        <div className="footer-container">
            <h4>© 2026 CityPulse. All rights reserved.</h4>
            <h4>Made with ❤️ by the CityPulse Team</h4>
        </div>
    )
}

export default Footer;