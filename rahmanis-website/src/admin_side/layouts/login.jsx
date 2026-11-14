// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import '../style/login.css';
import { useNavigate } from 'react-router-dom';
import dashboard from './dashboard';
import MainPage from './MainPage';
import ForgotPassword from './ForgotPassword';
import axios from 'axios';

function ForgotPasswordLink() {
  const navigate = useNavigate();

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        navigate('/forgot-password');
      }}
    >
      Forgot Password?
    </a>
  );
}



function AdminLogin() {
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const navigate = useNavigate();

 

const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(
      "/api/login",
      { adminName, adminPassword },
      { withCredentials: true }
    );

    // response.data is what your backend sends
    const data = response.data;
    console.log("Login response:", data);

    if (data.success) {
      // ✅ login successful
      navigate("/MainPage");
    } else {
      alert(data.message || "Login failed");
    }

  } catch (error) {
    // Catch network or server errors
    console.error("Login error:", error);
    alert('Network error: ' + error.message);
  }
};


  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Admin Login</h2>
        <input
          type="text"
          placeholder="Admin Name"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          required
        />

        <span className="forgot-password">
          <ForgotPasswordLink />
        </span>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;
