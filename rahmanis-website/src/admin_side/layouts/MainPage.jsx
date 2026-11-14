import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import '../style/MainPage.css'; 
import Dashboard from './dashboard';
import { Button } from '@mui/material';
import axios from 'axios';

function MainPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
const [unreadCount, setUnreadCount] = useState(0);


useEffect(() => {
  fetch("/api/check-auth", {
    method : "GET",
    credentials: "include",
  })
    .then(res => res.json())
    .then(data => {
      console.log("Auth check:", data);
      if (!data.authenticated) {
        navigate("/admin");
      } else {
        setAuthChecked(true);
      }
    })
    .catch(err => {
      console.error("Auth check error:", err);
      navigate("/admin");
    });
}, [navigate]);


  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "get",
      credentials: "include"
    });
    navigate("/admin");
  };


const fetchMessages = async () => {
  try {
    const res = await axios.get("/api/unreadmsgs");
   setUnreadCount(res.data.unreadCount || 0);
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
};


  useEffect(() =>  {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // update the data after every 5 second
    return () => clearInterval(interval);
  }, []);


  

  if (!authChecked) return <p>Loading...</p>; // wait until check is done

  return (
    <div className="main-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/insertationform">Add Vehicale</Link></li>
          <li><Link to="/denseTable">Vehicale info</Link></li>
          <li><Link to="/Supplierstbl">Suppliers</Link></li>
          <li><Link to="/Vehicals">Cars</Link></li>
          <li><Link to="/Parts">parts</Link></li>
          <li><Link to="/CustomersInseration">Customers</Link></li>
          <li><Link to="/Payments">Payments</Link></li>
          <li><Link to="/sales">Sales</Link></li>
          <li><Link to="/AdminInventory">Inventory</Link></li>
          <li><Link to="/Web_Vehicals">Web_Vehicals</Link></li>
          {/* <li><Link to = "/ContactInfo">ContactInfo</Link></li> */}
          <li>
  <Link to="/ContactInfo">ContactInfo{unreadCount > 0 && (
      <span
        style={{
          backgroundColor: "red",
          color: "white",
          borderRadius: "50%",
          padding: "2px 8px",
          marginLeft: "8px",
          fontSize: "0.8rem",
          fontWeight: "bold",
        }}
      >
        {unreadCount}
      </span>
    )}
  </Link>
</li>

          <li><Button variant="outlined" onClick={handleLogout}>Log Out</Button></li>
        </ul>
      </div>

      {/* Scrollable content */}
      <div className="main-content">
        <Dashboard />
      </div>
    </div>
  );
}

export default MainPage;
