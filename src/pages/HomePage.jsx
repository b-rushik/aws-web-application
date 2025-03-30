import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import Notifications from '../components/Notifications';

const HomePage = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = React.useState(true);

  return (
    <div className="home-page">
      {!user ? (
        <div className="auth-container">
          <div className="auth-tabs">
            <button 
              className={showLogin ? 'active' : ''}
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
            <button
              className={!showLogin ? 'active' : ''}
              onClick={() => setShowLogin(false)}
            >
              Register
            </button>
          </div>
          {showLogin ? <Login /> : <Register />}
        </div>
      ) : (
        <div className="welcome-message">
          <h2>Welcome, {user.attributes.name || user.attributes.email}!</h2>
          <Notifications />
        </div>
      )}
    </div>
  );
};

export default HomePage;