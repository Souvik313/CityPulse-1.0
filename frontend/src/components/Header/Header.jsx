import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar.jsx';
import axios from 'axios';
import headimage from '../../assets/citypulse-header.png';
import sidebar_icon from '../../assets/menu.png';
import search_icon from '../../assets/search.png';
import './Header.css';

const Header = () => {
    const [showSidebar , setShowSidebar] = useState(false);
    return (
        <header>
            <div className="header-inner">
            <div className="header-sidebar">
                <img src={sidebar_icon} alt="" onClick={() => setShowSidebar(prev => !prev)}/>
                {showSidebar && <Sidebar sidebarOpen = {showSidebar}/>}
            </div>
            <div className="header-image">
                <img src={headimage} alt="header-img" />
            </div>
            <div className="search-bar">
                <input type="text" placeholder='Enter city name' className='city-search-bar'/>
                <img src={search_icon} alt="search" className='search-icon'/>
            </div>
            <div className="header-items">
                <ul>
                    <li><Link to="/">Home</Link></li>
                    {localStorage.getItem("token") ? <li><Link to={`/users/${localStorage.getItem("userId")}`}>Profile</Link></li> : <li><Link to="/login">Login</Link></li>}
                    <li><Link to="/about">About us</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>
            </div>
        </header>
    );
};

export default Header;