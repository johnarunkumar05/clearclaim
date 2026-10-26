import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewClaim from './pages/NewClaim';
import ClaimList from './pages/ClaimList';
import ClaimDetail from './pages/ClaimDetail';
import Settlements from './pages/Settlements';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/claims/new"
            element={
              <PrivateRoute roles={['policyholder']}>
                <NewClaim />
              </PrivateRoute>
            }
          />
          <Route
            path="/claims"
            element={
              <PrivateRoute>
                <ClaimList />
              </PrivateRoute>
            }
          />
          <Route
            path="/claims/:id"
            element={
              <PrivateRoute>
                <ClaimDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/settlements"
            element={
              <PrivateRoute roles={['finance', 'admin', 'approver']}>
                <Settlements />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
