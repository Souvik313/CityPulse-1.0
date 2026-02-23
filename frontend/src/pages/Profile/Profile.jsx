import './Profile.css';
import { useFetchUser } from "../../hooks/useFetchUser.js";
import Header from '../../components/Header/Header.jsx';
import { useNavigate } from 'react-router-dom';

export const UserProfile = () => {

    const navigate = useNavigate();
    const {user , loading , error} = useFetchUser();
    if(loading) return <div>Loading...</div>
    if(error) return <div>Error: {error}</div>
    
    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
    }

    const handleUpdateUser = () => {
        alert("Redirecting to update page...");
        navigate(`/users/${user._id}/update`);
    }
    return (
        <>
        <Header />
        <div className="user">
            <h2>User Profile</h2>
            <h3>Name: {user.name}</h3>
            <p className='user-email'>Email: {user.email}</p>
            <p className='user-city'>Residing city: {user.city.name}</p>
            <p className="join-date">Joined on: {new Date(user.createdAt).toLocaleString()}</p>
            <p className="update-user" onClick={handleUpdateUser}><a>I want to update my details</a></p>
            <button className="sign-out" onClick={handleSignOut}>Sign out</button>
        </div>
        </>
    )
}