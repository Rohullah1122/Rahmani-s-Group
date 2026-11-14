// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/resetpassword.css'; // ✅ import the CSS file

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      setMessage('Please enter a new password.');
      return;
    }

    try {
      const response = await fetch(`/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successful!');
        setTimeout(() => navigate('/admin'), 2000);
      } else {
        setMessage(data.message || 'Reset failed');
      }
    } catch (error) {
      setMessage('Network error: ' + error.message);
    }
  };

  return (
    <div className="reset-container">
      <form onSubmit={handleReset} className="reset-form">
        <h2>Reset Password</h2>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="reset-input"
        />
        <button type="submit" className="reset-button">Reset Password</button>
        {message && <p className="reset-message">{message}</p>}
      </form>
    </div>
  );
}

export default ResetPassword;
