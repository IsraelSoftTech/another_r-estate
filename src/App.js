import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Landing from './components/Landing';
import Signin from './Auth/Signin';
import Signup from './Auth/Signup';
import AdminDash from './components/AdminDash';
import AdminProp from './components/AdminProp';
import AdminTransac from './components/AdminTransac';
import AdminGov from './components/AdminGov';
import AdminVerification from './components/AdminVerification';
import Users from './components/Users';
import LordDash from './components/LordDash';
import CouncilDash from './components/CouncilDash';
import CouncilVerifications from './components/CouncilVerifications';
import TenantProperties from './components/TenantProperties';
import TenantTransactions from './components/TenantTransactions';
import Chat from './components/Chat';
import LandProp from './components/LandProp';
import LandInquire from './components/LandInquire';
import TenantDash from './components/TenantDash';
import TechDash from './components/TechDash';
import LandTransac from './components/LandTransac';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', Arial, sans-serif;
    background: #fdf8f6;
    color: #222;
  }
`;

function App() {
  return (
    <Router>
      <GlobalStyle />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDash />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/properties" element={<AdminProp />} />
        <Route path="/admin/verification" element={<AdminVerification />} />
        <Route path="/admin/transactions" element={<AdminTransac />} />
        <Route path="/admin/government" element={<AdminGov />} />
        
        {/* Council Routes */}
        <Route path="/council" element={<CouncilDash />} />
        <Route path="/council/verifications" element={<CouncilVerifications />} />
        
        {/* Landlord Routes */}
        <Route path="/landlord" element={<LordDash />} />
        <Route path="/landlord/properties" element={<LandProp />} />
        <Route path="/landlord/transactions" element={<LandTransac />} />
        <Route path="/landlord/chats" element={<Chat />} />
        
        {/* Tenant Routes */}
        <Route path="/tenant" element={<TenantDash />} />
        <Route path="/tenant/properties" element={<TenantProperties />} />
        <Route path="/tenant/transactions" element={<TenantTransactions />} />
        <Route path="/tenant/chats" element={<Chat />} />
        
        {/* Other Dashboard Routes */}
        <Route path="/technician" element={<TechDash />} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/landlord" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 