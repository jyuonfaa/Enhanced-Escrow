import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserTransactions, Transaction } from '../../services/transaction.service';
import { createDispute } from '../../services/dispute.service';
import LoadingSpinner from '../../components/LoadingSpinner';

const BuyerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [disputeTxId, setDisputeTxId] = useState<number | null>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadTransactions();
    }, [user]);

    const loadTransactions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getUserTransactions(user.id, 'BUYER');
            setTransactions(data);
        } catch (error) {
            console.error('Error loading transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleRaiseDispute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !disputeTxId) return;

        try {
            await createDispute({
                transactionId: disputeTxId,
                initiatorId: user.id,
                reason: disputeReason
            });
            alert('Dispute raised successfully. Admin will review.');
            setDisputeTxId(null);
            setDisputeReason('');
            loadTransactions();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to raise dispute';
            alert(msg);
        }
    };

    const pendingTransactions = transactions.filter(t => t.isPending);
    const completedTransactions = transactions.filter(t => !t.isPending);
    const displayedTransactions = activeTab === 'PENDING' ? pendingTransactions : completedTransactions;

    if (loading) {
        return <LoadingSpinner message="Loading your purchases..." />;
    }

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>My Purchases</h1>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            background: activeTab === 'PENDING' ? 'white' : 'transparent',
                            fontWeight: activeTab === 'PENDING' ? 700 : 500,
                            boxShadow: activeTab === 'PENDING' ? 'var(--shadow-sm)' : 'none',
                            color: activeTab === 'PENDING' ? 'var(--color-brand)' : 'var(--text-muted)'
                        }}
                    >
                        Pending {pendingTransactions.length > 0 && `(${pendingTransactions.length})`}
                    </button>
                    <button
                        onClick={() => setActiveTab('COMPLETED')}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            background: activeTab === 'COMPLETED' ? 'white' : 'transparent',
                            fontWeight: activeTab === 'COMPLETED' ? 700 : 500,
                            boxShadow: activeTab === 'COMPLETED' ? 'var(--shadow-sm)' : 'none',
                            color: activeTab === 'COMPLETED' ? 'var(--color-brand)' : 'var(--text-muted)'
                        }}
                    >
                        Completed {completedTransactions.length > 0 && `(${completedTransactions.length})`}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {displayedTransactions.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p>No {activeTab.toLowerCase()} transactions found.</p>
                    </div>
                )}
                {displayedTransactions.map((t: Transaction) => (
                    <div key={t.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{t.product.name}</h3>
                                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                                    <code style={{ background: 'var(--color-surface-muted)', padding: '2px 6px', borderRadius: '4px' }}>#{t.id}</code>
                                </p>
                            </div>
                            <span style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                background: (t.status === 'COMPLETED' || t.status === 'DELIVERED') ? '#dcfce7' : t.status === 'DISPUTED' ? '#fee2e2' : '#fef9c3',
                                color: (t.status === 'COMPLETED' || t.status === 'DELIVERED') ? '#166534' : t.status === 'DISPUTED' ? '#991b1b' : '#854d0e',
                                border: '1px solid'
                            }}>
                                {t.status === 'DELIVERED' ? 'RECEIVED' : t.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-brand)' }}>GH₵{t.amount}</div>
                            </div>
                            {t.deliveredAt && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Delivery Date</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(t.deliveredAt).toLocaleDateString()}</div>
                                </div>
                            )}
                        </div>
                        <p>Amount: GH₵{t.amount}</p>
                        {t.deliveredAt && (
                            <p style={{ fontSize: '0.85rem', color: '#666' }}>Delivered: {new Date(t.deliveredAt).toLocaleString()}</p>
                        )}

                        {t.status === 'AWAITING_OTP' && (
                            <div style={{ backgroundColor: 'var(--color-brand-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-brand)', marginBottom: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-brand-dark)', fontWeight: 600 }}>
                                    📦 Product Reached! Share this OTP with the agent upon inspection:
                                </p>
                                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '4px', marginTop: '0.5rem', color: 'var(--color-brand)' }}>{t.escrowCode}</div>
                            </div>
                        )}

                        {t.status === 'ESCROW_HELD' && (
                            <div style={{ padding: '1rem', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>{t.agentId ? '🚚' : '🏭'}</span>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                    {t.agentId ? (
                                        <>
                                            Agent <strong>{t.agent?.fullName}</strong> ({t.agent?.phone}) is on their way to your location.
                                        </>
                                    ) : (
                                        "Payment verified. Your item is currently at the warehouse. An agent will be assigned shortly."
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Dispute Logic: Allowed if AWAITING_OTP (Bounced) OR COMPLETED within 24h (Received) */}
                        {(() => {
                            const isAwaitingOtp = t.status === 'AWAITING_OTP';
                            const isDelivered = t.status === 'DELIVERED';
                            const isCompleted = t.status === 'COMPLETED';
                            const isEscrowHeld = t.status === 'ESCROW_HELD';

                            let showDispute = isAwaitingOtp;

                            if ((isDelivered || isCompleted) && t.deliveredAt) {
                                const deliveryDate = new Date(t.deliveredAt);
                                const now = new Date();
                                const diffHours = (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60);
                                if (diffHours <= 24) showDispute = true;
                            }

                            if (isEscrowHeld) {
                                const orderDate = new Date(t.createdAt);
                                const now = new Date();
                                const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
                                if (diffDays >= 7) showDispute = true;
                            }

                            if (showDispute) {
                                return (
                                    <button
                                        onClick={() => setDisputeTxId(t.id)}
                                        className="btn btn-primary"
                                        style={{ width: '100%', backgroundColor: 'var(--color-error)' }}
                                    >
                                        {isAwaitingOtp ? 'Reject & Refund' : 'Report an Issue'}
                                    </button>
                                );
                            }
                            return null;
                        })()}

                        {t.status === 'DISPUTED' && (
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', border: '1px solid #fecaca' }}>
                                    ⚖️ Case under investigation by support
                                </div>
                                {t.disputes && t.disputes.length > 0 && t.disputes[0].sellerResponse && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SELLER'S STATEMENT:</div>
                                        <div style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>"{t.disputes[0].sellerResponse}"</div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Logic for Buyer to enter OTP will go here in Phase 5/6 */}
                    </div>
                ))}
            </div>

            {disputeTxId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px' }}>
                        <h3>Raise Dispute</h3>
                        <form onSubmit={handleRaiseDispute}>
                            <textarea
                                placeholder="Reason for dispute (e.g. Needs refund, item damaged)"
                                value={disputeReason}
                                onChange={e => setDisputeReason(e.target.value)}
                                required
                                style={{ width: '100%', height: '100px', margin: '1rem 0', padding: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--color-error)' }}>Submit</button>
                                <button type="button" onClick={() => setDisputeTxId(null)} style={{ flex: 1, padding: '0.5rem', background: '#ccc' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyerDashboard;
