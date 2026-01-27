import React, { useState, useEffect } from 'react';
import { assignAgent } from '../../services/delivery.service';
import { getAllDisputes, resolveDispute, Dispute } from '../../services/dispute.service';
import { getAgents, createAgent, deleteAgent, User } from '../../services/auth.service';
import {
    getAdminStats,
    getAllUsers,
    getAllTransactions,
    toggleUserSuspension,
    AdminStats,
    GlobalUser,
    GlobalTransaction
} from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

type Tab = 'overview' | 'users' | 'transactions' | 'agents' | 'disputes';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Stats
    const [stats, setStats] = useState<AdminStats | null>(null);

    // Data
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [agents, setAgents] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<GlobalUser[]>([]);
    const [allTransactions, setAllTransactions] = useState<GlobalTransaction[]>([]);

    // Loading states
    const [loading, setLoading] = useState(false);

    // Form states
    const [agentFormData, setAgentFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: ''
    });

    const [resolutionReason, setResolutionReason] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [statsData, disputesData, agentsData] = await Promise.all([
                getAdminStats(),
                getAllDisputes(),
                getAgents()
            ]);
            setStats(statsData);
            setDisputes(disputesData);
            setAgents(agentsData);
        } catch (error) {
            console.error('Failed to load initial admin data');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setAllUsers(data);
        } catch (error) {
            console.error('Failed to load users');
        }
    };

    const loadTransactions = async () => {
        try {
            const data = await getAllTransactions();
            setAllTransactions(data);
        } catch (error) {
            console.error('Failed to load transactions');
        }
    };

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'transactions') loadTransactions();
        if (activeTab === 'disputes') loadInitialData(); // Reload disputes
    }, [activeTab]);

    const handleResolve = async (disputeId: number, decision: string) => {
        if (!user) return;
        const reason = resolutionReason[disputeId];
        if (!reason) return alert('Please provide a reason for your decision.');

        try {
            await resolveDispute({
                disputeId,
                decision,
                decisionReason: reason,
                adminId: user.id
            });
            alert('Dispute Resolved');
            loadInitialData();
        } catch (error) {
            alert('Failed to resolve dispute');
        }
    };

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAgent(agentFormData);
            alert('Agent Created Successfully');
            setAgentFormData({ email: '', password: '', fullName: '', phone: '' });
            loadInitialData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create agent');
        }
    };

    const handleDeleteAgent = async (id: number) => {
        if (!confirm('Are you sure you want to remove this agent?')) return;
        try {
            await deleteAgent(id);
            alert('Agent Removed');
            loadInitialData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to remove agent');
        }
    };

    const handleToggleSuspension = async (userId: number, currentStatus: boolean) => {
        const action = currentStatus ? 'unsuspend' : 'suspend';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            await toggleUserSuspension(userId, !currentStatus);
            alert(`User ${action}ed successfully`);
            loadUsers();
        } catch (error) {
            alert('Failed to update user status');
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading Admin Panel..." />;
    }

    return (
        <div className="page-container">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.25rem' }}>Administrator Command Center</h1>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Global system management and oversight</p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '1rem',
                overflowX: 'auto'
            }}>
                {(['overview', 'users', 'transactions', 'agents', 'disputes'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid transparent',
                            background: activeTab === tab ? 'var(--color-brand)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--text)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <StatCard label="Total Users" value={stats?.users || 0} icon="👥" />
                    <StatCard label="Total Transactions" value={stats?.transactions || 0} icon="📦" />
                    <StatCard label="Escrow Volume" value={`$${stats?.escrowHeld.toFixed(2) || '0.00'}`} icon="💰" />
                    <StatCard label="Open Disputes" value={stats?.openDisputes || 0} icon="⚖️" color="var(--color-error)" />
                </div>
            )}

            {activeTab === 'users' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>User Directory</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem' }}>Name</th>
                                    <th style={{ padding: '1rem' }}>Phone</th>
                                    <th style={{ padding: '1rem' }}>Role</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Joined</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {u.phone}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: 'var(--color-surface-muted)',
                                                fontWeight: 700
                                            }}>{u.role}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                color: u.isSuspended ? 'var(--color-error)' : 'var(--color-success)',
                                                fontWeight: 700
                                            }}>
                                                {u.isSuspended ? '● Suspended' : '● Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {u.id !== user?.id && (
                                                <button
                                                    onClick={() => handleToggleSuspension(u.id, u.isSuspended)}
                                                    className={`btn ${u.isSuspended ? 'btn-outline' : 'btn-primary'}`}
                                                    style={{
                                                        padding: '0.25rem 0.75rem',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: u.isSuspended ? '' : 'var(--color-error)'
                                                    }}
                                                >
                                                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'transactions' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Global Transaction Hub</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {allTransactions.map(t => (
                            <div key={t.id} style={{
                                padding: '1rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{t.product.name} - ${t.amount}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Buyer: {t.buyer.fullName} | Seller: {t.seller.fullName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                        Agent: {t.agent?.fullName || 'Not Assigned'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                        📍 <strong>Destination:</strong> {t.deliveryAddress || 'N/A'}
                                        {t.buyerLat && t.buyerLng && (
                                            <a href={`https://www.google.com/maps?q=${t.buyerLat},${t.buyerLng}`} target="_blank" rel="noreferrer" style={{ marginLeft: '1rem', color: 'var(--color-brand)' }}>[Target Map]</a>
                                        )}
                                        {t.agentLat && t.agentLng && (
                                            <a href={`https://www.google.com/maps?q=${t.agentLat},${t.agentLng}`} target="_blank" rel="noreferrer" style={{ marginLeft: '1rem', color: 'var(--color-success)' }}>[Delivery Map]</a>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        background: getStatusColor(t.status),
                                        color: 'white'
                                    }}>
                                        {t.status}
                                    </span>
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                        {new Date(t.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'agents' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                    <div className="card" style={{ borderTop: '4px solid var(--color-success)' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>👤 New Delivery Agent</h3>
                        <form onSubmit={handleCreateAgent} style={{ display: 'grid', gap: '1rem' }}>
                            <input
                                placeholder="Full Name"
                                value={agentFormData.fullName}
                                onChange={e => setAgentFormData({ ...agentFormData, fullName: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={agentFormData.email}
                                onChange={e => setAgentFormData({ ...agentFormData, email: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                            <input
                                placeholder="Phone"
                                value={agentFormData.phone}
                                onChange={e => setAgentFormData({ ...agentFormData, phone: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={agentFormData.password}
                                onChange={e => setAgentFormData({ ...agentFormData, password: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Agent</button>
                        </form>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Agent Registry</h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {agents.map(a => (
                                <div key={a.id} style={{
                                    padding: '1rem',
                                    background: 'var(--color-surface-muted)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{a.fullName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.email}</div>
                                    </div>
                                    <button onClick={() => handleDeleteAgent(a.id)} style={{ color: 'var(--color-error)', border: 'none', background: 'none', cursor: 'pointer' }}>✕ Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'disputes' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>⚖️ Dispute Resolution Queue</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {disputes.map(d => (
                            <div key={d.id} className="card" style={{ opacity: d.status === 'RESOLVED' ? 0.7 : 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 800 }}>CASE #{d.id} - {d.status}</div>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontWeight: 800,
                                                background: d.itemStatus === 'BOUNCED' ? '#ffedd5' : (d.itemStatus === 'RECEIVED' ? '#dcfce7' : '#fee2e2'),
                                                color: d.itemStatus === 'BOUNCED' ? '#9a3412' : (d.itemStatus === 'RECEIVED' ? '#166534' : '#991b1b'),
                                                border: '1px solid currentColor'
                                            }}>
                                                {d.itemStatus?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>Item: <strong>{d.transaction?.product?.name}</strong></div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                👤 B: {d.transaction?.buyer?.phone} | 🏪 S: {d.transaction?.seller?.phone}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                            📍 <strong>Destination:</strong> {d.transaction?.deliveryAddress || 'N/A'}
                                            {d.transaction?.buyerLat && d.transaction?.buyerLng && (
                                                <a href={`https://www.google.com/maps?q=${d.transaction.buyerLat},${d.transaction.buyerLng}`} target="_blank" rel="noreferrer" style={{ marginLeft: '1rem', color: 'var(--color-brand)' }}>[Target Map]</a>
                                            )}
                                            {d.transaction?.agentLat && d.transaction?.agentLng && (
                                                <a href={`https://www.google.com/maps?q=${d.transaction.agentLat},${d.transaction.agentLng}`} target="_blank" rel="noreferrer" style={{ marginLeft: '1rem', color: 'var(--color-success)' }}>[Delivery Map]</a>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                            <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                    INITIATOR STATEMENT ({d.initiator?.role}) - {d.initiator?.phone}:
                                                </div>
                                                <div style={{ fontSize: '0.875rem' }}>{d.reason}</div>
                                            </div>

                                            <div style={{ padding: '0.75rem', background: d.sellerResponse ? '#f0fdf4' : '#fff7ed', borderRadius: '4px', border: `1px solid ${d.sellerResponse ? '#bbf7d0' : '#ffedd5'}` }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SELLER STATEMENT:</div>
                                                {d.sellerResponse ? (
                                                    <div style={{ fontSize: '0.875rem' }}>{d.sellerResponse}</div>
                                                ) : (
                                                    <div style={{ fontSize: '0.875rem', color: '#9a3412', fontWeight: 600 }}>Awaiting seller response...</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {d.status === 'RESOLVED' && (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '0.75rem',
                                            background: d.decision === 'REFUND_BUYER' ? '#fef2f2' : '#f0fdf4',
                                            border: `1px solid ${d.decision === 'REFUND_BUYER' ? '#fecaca' : '#bbf7d0'}`,
                                            borderRadius: 'var(--radius-sm)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <strong style={{ color: d.decision === 'REFUND_BUYER' ? 'var(--color-error)' : 'var(--color-success)' }}>
                                                    ADMIN DECISION: {d.decision?.replace('_', ' ')}
                                                </strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(d.updatedAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                                                <strong>Reason: </strong> {d.decisionReason}
                                            </div>
                                        </div>
                                    )}

                                    {d.status === 'OPEN' && (
                                        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                                            <textarea
                                                placeholder="State the reason for this decision (logged)..."
                                                value={resolutionReason[d.id] || ''}
                                                onChange={(e) => setResolutionReason({ ...resolutionReason, [d.id]: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', minHeight: '60px' }}
                                            />
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button onClick={() => handleResolve(d.id, 'REFUND_BUYER')} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--color-error)' }}>Refund Buyer</button>
                                                <button onClick={() => handleResolve(d.id, 'RELEASE_SELLER')} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--color-success)' }}>Release to Seller</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function StatCard({ label, value, icon, color = 'var(--color-brand)' }: any) {
    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'COMPLETED': return 'var(--color-success)';
        case 'DISPUTED': return 'var(--color-error)';
        case 'ESCROW_HELD': return 'var(--color-brand)';
        case 'PENDING': return '#64748b';
        default: return '#94a3b8';
    }
}

export default AdminDashboard;

