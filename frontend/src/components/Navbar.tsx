import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{
            height: 'var(--nav-height)',
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <h2
                    style={{
                        margin: 0,
                        cursor: 'pointer',
                        color: 'var(--color-brand)',
                        fontSize: '1.5rem',
                        fontWeight: 800
                    }}
                    onClick={() => navigate('/')}
                >
                    Escrow<span style={{ color: 'var(--text-main)' }}>Elite</span>
                </h2>

                <div className="nav-links" style={{ display: 'flex', gap: '1.5rem' }}>
                    <Link to="/products" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Marketplace</Link>
                    {isAuthenticated && (
                        <>
                            {user?.role === 'BUYER' && <Link to="/dashboard/buyer" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>My Purchases</Link>}
                            {user?.role === 'SELLER' && <Link to="/dashboard/seller" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Seller Central</Link>}
                            {user?.role === 'AGENT' && <Link to="/dashboard/agent" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Agent Jobs</Link>}
                            {user?.role === 'ADMIN' && <Link to="/dashboard/admin" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Admin Panel</Link>}
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isAuthenticated ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right', display: 'none' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</div>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-brand-surface)',
                            color: 'var(--color-brand)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.875rem'
                        }}>
                            {user?.fullName.charAt(0)}
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <button onClick={() => navigate('/login')} className="btn btn-primary">
                        Sign In
                    </button>
                )}
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .nav-links { display: none !important; }
                    nav { padding: 0 1rem !important; }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
