import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import SellerDashboard from './pages/dashboard/SellerDashboard';
import BuyerDashboard from './pages/dashboard/BuyerDashboard';
import AgentDashboard from './pages/dashboard/AgentDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Navbar from './components/Navbar';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, roles }: { children: JSX.Element, roles?: string[] }) => {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
};

// Role-based Dashboard Redirect
const DashboardRedirect = () => {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

    switch (user.role) {
        case 'SELLER': return <Navigate to="/dashboard/seller" replace />;
        case 'BUYER': return <Navigate to="/dashboard/buyer" replace />;
        case 'AGENT': return <Navigate to="/dashboard/agent" replace />;
        case 'ADMIN': return <Navigate to="/dashboard/admin" replace />;
        default: return <Navigate to="/products" replace />;
    }
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Public Marketplace */}
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/:id" element={<ProductDetail />} />

                    {/* Dashboards */}
                    <Route path="/dashboard/seller" element={
                        <ProtectedRoute roles={['SELLER']}>
                            <SellerDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard/buyer" element={
                        <ProtectedRoute roles={['BUYER']}>
                            <BuyerDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard/agent" element={
                        <ProtectedRoute roles={['AGENT']}>
                            <AgentDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard/admin" element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Main Redirect */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/dashboard" element={<DashboardRedirect />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
