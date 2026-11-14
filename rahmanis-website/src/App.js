import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';



import WrapperMainPage from './client_side/wrappers/WrapperMainPage';
import WrapperInventory from './client_side/wrappers/WrapperInventory';
import SellCar from './client_side/Layouts/SellCar';
import ClientMainpage from './client_side/Layouts/MainPage';
import Contact from './client_side/Layouts/Contact';
import AdminLogin from './admin_side/layouts/login';
import Dashboard from './admin_side/layouts/dashboard';
import ForgotPassword from './admin_side/layouts/ForgotPassword';
import ResetPassword from './admin_side/layouts/Resetpassword';
import MainPage from './admin_side/layouts/MainPage';
import Insertion_form from './admin_side/components/Insertation_form';
import DenseTable from './admin_side/components/DenseTable';
import Supplierstbl from './admin_side/components/supplierstbl';
import Vehicals from './admin_side/layouts/Vehicals';
import CustomersInseration from './admin_side/layouts/CustomersInseration';
import Parts from './admin_side/layouts/parts';
import Payments from './admin_side/layouts/Payments';
import AdminInventory from './admin_side/layouts/AdminInventory';
import ProtectedRoute from "./ProtectedRoute";
import Web_Vehicals from "./admin_side/layouts/Web_Vehicals";
import ContactInfo from "./admin_side/layouts/ContactInfo";



function App() {
  return (
    <Router>
      <Routes>
        {/* Client side routes */}
        <Route path="/" element={<WrapperMainPage />} />
        <Route path="/inventory" element={<WrapperInventory />} />
        <Route path="/SellCar" element={<SellCar />} />
        <Route path="/contact" element={<Contact />} />
         <Route path = "ClientMainpage" element = {<ClientMainpage />}/>
        {/* Admin side routes */}
        <Route path="/admin" element={<AdminLogin />} />
      <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
    
        <Route
  path="/Mainpage"element={<ProtectedRoute> <MainPage /> </ProtectedRoute>} />
        <Route path="/insertationform" element={<ProtectedRoute><Insertion_form /></ProtectedRoute>} />
        <Route path="/DenseTable" element={<ProtectedRoute>  <DenseTable /> </ProtectedRoute>} />
        <Route path="/Supplierstbl" element={<ProtectedRoute><Supplierstbl /> </ProtectedRoute>} />
        <Route path="/Vehicals" element={<ProtectedRoute> <Vehicals /> </ProtectedRoute>} />
        <Route path='CustomersInseration' element = {<ProtectedRoute> <CustomersInseration /> </ProtectedRoute>}></Route>
        <Route path="/Parts" element={<ProtectedRoute> <Parts /> </ProtectedRoute>} />
        <Route path="/Payments" element={<ProtectedRoute> <Payments /> </ProtectedRoute>} />
        <Route path="/AdminInventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
        <Route path="/Web_Vehicals" element={<ProtectedRoute><Web_Vehicals /></ProtectedRoute>} />
        <Route path="/ContactInfo" element={<ProtectedRoute><ContactInfo /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
