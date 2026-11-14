import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import axios from 'axios';



function Dashboard() {
  const [salesData, setSalesData] = useState([]);
  const [PurchaseData, setPurchaseData] = useState([]);

 
  useEffect(() => {
axios.post('/api/purchased', { withCredentials: true })
      .then(res => {
        const apiData = res.data.map(item => ({
          month: item.purchase_date,       // match your API response key
          purchase: parseFloat(item.total_purchase), // match your API response key
        }));
        setPurchaseData(apiData);
        console.log(apiData);
      })
      .catch(err => {
        console.error("Error fetching purchase data:", err);
      });
  }, []);
  
  //work on session why do i need to login everytime
  


  useEffect(() => {
   axios.post('/api/sale', { withCredentials: true })
   .then(res => {
        const apiData = res.data.map(item => ({
          month: item.sale_month,
          sales: parseFloat(item.total_sales),
        }));
        setSalesData(apiData);
      })
      .catch(err => {
        console.error("Error fetching sales data:", err);
      });
  }, []);

  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
  const totalPurchases = PurchaseData.reduce((sum, item) => sum + item.purchase, 0);
   const revenue  = totalSales - totalPurchases;

  return (
    <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Dashboard Overview</h1>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {/* Sales Graph */}
        <div style={{ flex: 1, minWidth: '300px', background: '#fff', padding: '1rem', borderRadius: '10px' }}>
          <h3>Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
     
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Purchase Graph */}
        <div style={{ flex: 1, minWidth: '300px', background: '#fff', padding: '1rem', borderRadius: '10px' }}>
          <h3>Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PurchaseData}>
            {console.log(PurchaseData)}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="purchases" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Summary */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#fff',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '1.5rem',
        fontWeight: 'bold',
      }}>
        Total Revenue: ${revenue}
      </div>
    </div>
  );
}

export default Dashboard;
