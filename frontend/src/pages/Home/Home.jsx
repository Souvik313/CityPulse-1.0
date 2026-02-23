import { useState } from "react";
import axios from 'axios';
import Header from "../../components/Header/Header.jsx";
import Body from '../../components/Body/Body.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import './Home.css';

const Home = () => {
    return (
        <div className="home">
            <Header />
            <main className="home-body">
                <Body />
            </main>
            <Footer />
        </div>
    )
}

export default Home;