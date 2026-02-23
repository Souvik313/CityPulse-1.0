import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import menu_icon from '../../assets/menu.png';
import axios from "axios";
import  './Sidebar.css';

const Sidebar = ({sidebarOpen}) => {
    return(
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <ul>
                <li>Home</li>
                <li>City Feed</li>
                <li>Profile</li>
                <li>Settings</li>
            </ul>
        </div>
    )
}

export default Sidebar;