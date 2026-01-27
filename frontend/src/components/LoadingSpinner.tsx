
import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)' }}>{message}</p>
            <style>{`
                .spinner {
                    width: 3rem;
                    height: 3rem;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--color-brand);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
