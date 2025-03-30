import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Common/Header';
import Navbar from './components/Common/Navbar';
import HomePage from './pages/HomePage';
import PaperSetterPage from './pages/PaperSetterPage';
import PaperGetterPage from './pages/PaperGetterPage';
import AdminPage from './pages/AdminPage';
import SuperUserPage from './pages/SuperUserPage';
import './App.css';

Amplify.configure({
  Auth: {
    region: process.env.REGION,
    userPoolId: process.env.USER_POOL_ID,
    userPoolWebClientId: process.env.USER_POOL_CLIENT_ID,
  }
});

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/paper-setter" element={<PaperSetterPage />} />
            <Route path="/paper-getter" element={<PaperGetterPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/super-user" element={<SuperUserPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;