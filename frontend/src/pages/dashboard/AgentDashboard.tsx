import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAgentJobs, verifyDelivery, uploadDeliveryPhoto } from '../../services/delivery.service';
import { Transaction } from '../../services/transaction.service';
import LoadingSpinner from '../../components/LoadingSpinner';

const AgentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Transaction[]>([]);
    const [selectedJob, setSelectedJob] = useState<Transaction | null>(null);
    const [step, setStep] = useState<1 | 2>(1); // 1: Photo, 2: OTP
    const [otp, setOtp] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await getAgentJobs(user.id);
            setJobs(data);
        } catch (error) {
            console.error('Error loading jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadPhoto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;
        try {
            await uploadDeliveryPhoto({
                transactionId: selectedJob.id,
                photoUrl
            });
            alert('Photo uploaded. Now ask buyer for the OTP.');
            setStep(2); // Move to OTP step
            loadJobs();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to upload photo proof.';
            alert(msg);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;

        let agentCoords: { lat?: number, lng?: number } = {};

        if (navigator.geolocation) {
            try {
                const position: any = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                agentCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            } catch (error) {
                console.warn("Could not capture agent location at delivery time");
            }
        }

        try {
            await verifyDelivery({
                transactionId: selectedJob.id,
                otp,
                agentLat: agentCoords.lat,
                agentLng: agentCoords.lng
            });
            alert('Delivery Verified!');
            handleCloseModal();
            loadJobs();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Verification Failed. Check OTP.';
            alert(msg);
        }
    };

    const handleCloseModal = () => {
        setSelectedJob(null);
        setStep(1);
        setOtp('');
        setPhotoUrl('');
    };

    if (loading) {
        return <LoadingSpinner message="Loading Agent Deliveries..." />;
    }

    return (
        <div className="page-container">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ marginBottom: '0.25rem' }}>Delivery Management</h1>
                <p style={{ margin: 0 }}>View and fulfill your active delivery assignments</p>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {jobs.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ fontSize: '1.125rem' }}>No active delivery jobs assigned yet.</p>
                    </div>
                )}
                {jobs.map(job => (
                    <div key={job.id} className="card" style={{ borderLeft: '4px solid var(--color-brand)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{job.product.name}</h3>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    <div style={{ fontSize: '0.875rem' }}>
                                        📍 Pick up from: <strong>
                                            {(job.status === 'DISPUTED' || job.status === 'REFUNDED')
                                                ? `${job.buyer?.fullName} (${job.buyer?.phone})`
                                                : `${job.seller?.fullName} (${job.seller?.phone})`}
                                        </strong>
                                    </div>
                                    <div style={{ fontSize: '0.875rem' }}>
                                        🏁 Deliver to: <strong>
                                            {(job.status === 'DISPUTED' || job.status === 'REFUNDED')
                                                ? `${job.seller?.fullName} (${job.seller?.phone})`
                                                : `${job.buyer?.fullName} (${job.buyer?.phone})`}
                                        </strong>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--text-main)', borderLeft: '2px solid var(--color-brand)', paddingLeft: '0.5rem' }}>
                                        🏠 <strong>Address:</strong> {job.deliveryAddress || 'Ask buyer for address'}
                                        {job.buyerLat && job.buyerLng && (
                                            <a
                                                href={`https://www.google.com/maps?q=${job.buyerLat},${job.buyerLng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ marginLeft: '1rem', color: 'var(--color-brand)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700 }}
                                            >
                                                📍 OPEN IN MAPS
                                            </a>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>🏪 Seller</div>
                                            <div style={{ fontSize: '0.875rem' }}>{job.seller?.fullName}</div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand)' }}>{job.seller?.phone}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>👤 Buyer</div>
                                            <div style={{ fontSize: '0.875rem' }}>{job.buyer?.fullName}</div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand)' }}>{job.buyer?.phone}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                            {job.status === 'ESCROW_HELD' && (
                                <button
                                    onClick={() => { setSelectedJob(job); setStep(1); }}
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                >
                                    📷 Upload Delivery Proof
                                </button>
                            )}
                            {job.status === 'AWAITING_OTP' && (
                                <button
                                    onClick={() => { setSelectedJob(job); setStep(2); }}
                                    className="btn btn-primary"
                                    style={{ width: '100%', backgroundColor: 'var(--color-warning)' }}
                                >
                                    🔑 Enter Customer OTP
                                </button>
                            )}
                            {(job.status === 'DISPUTED' || job.status === 'REFUNDED') && (
                                <div style={{ padding: '1rem', background: '#fff7ed', color: '#9a3412', borderRadius: 'var(--radius-sm)', border: '1px solid #fdba74' }}>
                                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>↩️</span> Return to Seller
                                    </div>
                                    <p style={{ fontSize: '0.875rem', margin: '4px 0 0' }}>
                                        Delivery rejected/cancelled. Please return the item to <strong>{job.product.seller?.fullName}</strong>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {
                selectedJob && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px' }}>
                            <h2>{step === 1 ? 'Step 1: Upload Photo Proof' : 'Step 2: Enter Buyer OTP'}</h2>

                            {step === 1 ? (
                                <form onSubmit={handleUploadPhoto}>
                                    <p>Take a photo of the item at the location.</p>
                                    <input
                                        placeholder="Photo URL (Mock Upload)"
                                        value={photoUrl}
                                        onChange={e => setPhotoUrl(e.target.value)}
                                        required
                                        style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '1rem 0' }}
                                    />
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Upload & Notify Buyer</button>
                                        <button type="button" onClick={handleCloseModal} style={{ flex: 1, padding: '0.5rem', background: '#ccc' }}>Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp}>
                                    <p>Ask Buyer for the 6-digit OTP visible on their dashboard.</p>
                                    <input
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        required
                                        style={{ display: 'block', width: '100%', padding: '0.5rem', margin: '1rem 0' }}
                                    />
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--color-success)' }}>Complete Verification</button>
                                        <button type="button" onClick={handleCloseModal} style={{ flex: 1, padding: '0.5rem', background: '#ccc' }}>Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default AgentDashboard;
