import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSellerProducts, createProduct, updateProduct, Product, deleteProduct as deleteProductService } from '../../services/product.service';
import { getUserTransactions, Transaction, getSellerStats } from '../../services/transaction.service';
import { getAgents, User as Agent } from '../../services/auth.service';
import { assignAgent as assignAgentService, confirmReturn } from '../../services/delivery.service';
import { respondToDispute } from '../../services/dispute.service';
import LoadingSpinner from '../../components/LoadingSpinner';

const SellerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<{ [key: number]: string }>({});
    const [isCreating, setIsCreating] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, imageUrl: '' });
    const [responseFormData, setResponseFormData] = useState<{ [key: number]: string }>({});
    const [showDeliveryDetails, setShowDeliveryDetails] = useState<Transaction | null>(null);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'HISTORY'>('PENDING');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, [user]);

    const loadInitialData = async () => {
        setLoading(true);
        // Ensure we wait for the context user to be available for initial fetch
        if (!user) {
            setLoading(false);
            return;
        }
        await Promise.all([
            loadProducts(),
            loadTransactions(),
            loadAgents()
        ]);
        setLoading(false);
    };

    const loadProducts = async () => {
        if (user) {
            try {
                const data = await getSellerProducts(user.id);
                setProducts(data);
            } catch (error) {
                console.error('Failed to load products');
            }
        }
    };

    const loadTransactions = async () => {
        if (user) {
            try {
                const data = await getUserTransactions(user.id, 'SELLER');
                setTransactions(Array.isArray(data) ? data.filter(t => t && typeof t === 'object') : []);
            } catch (error) {
                console.error('Failed to load transactions', error);
                setTransactions([]);
            }
        }
    };


    const loadAgents = async () => {
        try {
            const data = await getAgents();
            setAgents(data);
        } catch (error) {
            console.error('Failed to load agents');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, newProduct);
                alert('Product updated successfully');
            } else {
                await createProduct({ ...newProduct, sellerId: user.id });
                alert('Product created successfully');
            }
            setIsCreating(false);
            setEditingProduct(null);
            setNewProduct({ name: '', description: '', price: 0, imageUrl: '' });
            loadProducts();
        } catch (error: any) {
            const msg = error.response?.data?.message || (editingProduct ? 'Failed to update product' : 'Failed to create product');
            alert(msg);
        }
    };

    const handleEditStart = (p: Product) => {
        setEditingProduct(p);
        setNewProduct({
            name: p.name,
            description: p.description,
            price: p.price,
            imageUrl: p.imageUrl || ''
        });
        setIsCreating(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelForm = () => {
        setIsCreating(false);
        setEditingProduct(null);
        setNewProduct({ name: '', description: '', price: 0, imageUrl: '' });
    };

    const handleDeleteProduct = async (id: number) => {
        if (confirm('Delete this product?')) {
            try {
                await deleteProductService(id);
                loadProducts();
            } catch (error) {
                alert('Failed to delete product');
            }
        }
    };

    const handleAssignAgent = async (transactionId: number) => {
        const agentId = selectedAgentId[transactionId];
        if (!agentId) return alert('Please select an agent');

        try {
            await assignAgentService({ transactionId, agentId: Number(agentId) });
            alert('Agent assigned successfully');
            loadTransactions();
        } catch (error) {
            alert('Failed to assign agent');
        }
    };

    const handleConfirmReturn = async (transactionId: number) => {
        if (!confirm('Confirm that you have received the item back from the agent?')) return;
        try {
            await confirmReturn(transactionId);
            alert('Return confirmed. Item is back in your possession.');
            loadTransactions();
        } catch (error) {
            alert('Failed to confirm return');
        }
    };

    const handleRespondDispute = async (disputeId: number) => {
        const response = responseFormData[disputeId];
        if (!response) return alert('Please provide a statement');

        try {
            await respondToDispute({ disputeId, response });
            alert('Statement submitted successfully');
            loadTransactions();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit statement');
        }
    };

    // Calculate stats locally from transactions to ensure perfect sync
    const localSalesMade = transactions.reduce((sum, t) => {
        const isFinalized = !t.isPending && (t.status === 'COMPLETED' || t.status === 'DELIVERED');
        return isFinalized ? sum + t.amount : sum;
    }, 0);

    const localEscrowBalance = transactions.reduce((sum, t) => {
        // Active escrow = anything in transit, held, delivered < 24h, or disputed
        const inEscrow = t.isPending && ['ESCROW_HELD', 'AWAITING_OTP', 'DELIVERED', 'DISPUTED'].includes(t.status);
        return inEscrow ? sum + t.amount : sum;
    }, 0);

    const pendingTransactions = transactions.filter(t => t?.isPending && t.status !== 'REFUNDED' && t.status !== 'RETURNED');
    const completedTransactions = transactions.filter(t => !t.isPending && (t?.status === 'COMPLETED' || t?.status === 'DELIVERED'));
    const historyTransactions = transactions.filter(t => (t?.status === 'REFUNDED' || t?.status === 'RETURNED'));

    let displayedTransactions = pendingTransactions;
    if (activeTab === 'COMPLETED') displayedTransactions = completedTransactions;
    if (activeTab === 'HISTORY') displayedTransactions = historyTransactions;

    if (loading) {
        return <LoadingSpinner message="Loading Seller Central..." />;
    }

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Seller Central</h1>
                    <p style={{ margin: 0 }}>Manage your inventory and track your sales performance</p>
                </div>
                <button
                    onClick={() => isCreating ? handleCancelForm() : setIsCreating(true)}
                    className={`btn ${isCreating ? 'btn-outline' : 'btn-primary'}`}
                >
                    {isCreating ? '✕ Cancel' : '+ Add New Product'}
                </button>
            </div>

            {isCreating && (
                <div className="card" style={{ marginBottom: '2.5rem', border: '2px solid var(--color-brand)' }}>
                    <h3 style={{ marginBottom: '1.25rem' }}>{editingProduct ? `Edit Product: ${editingProduct.name}` : 'List a New Product'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <input placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                            <textarea placeholder="Product Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', minHeight: '100px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="number" placeholder="Price (GH₵)" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} min="1" step="0.01" required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                                <input placeholder="Image URL (optional)" value={newProduct.imageUrl} onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{editingProduct ? 'Update Product' : 'Publish Product'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ background: 'var(--color-brand)', color: 'white', border: 'none' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Sales (Withdrawable)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>GH₵{localSalesMade.toFixed(2)}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>Funds from completed orders</div>
                </div>
                <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Active Escrow</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-brand)' }}>GH₵{localEscrowBalance.toFixed(2)}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Held until delivery + 24h</div>
                </div>
                <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Finalized Returns</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{historyTransactions.length}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Items returned or refunded</div>
                </div>
            </div>

            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Inventory Status</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {products.length === 0 && <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No products listed yet.</div>}
                    {products.map(p => (
                        <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{p?.name || 'Unnamed Product'}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p?.description || 'No description'}</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div style={{ fontWeight: 800, color: 'var(--color-brand)', fontSize: '1.125rem' }}>GH₵{p?.price || 0}</div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => handleEditStart(p)}
                                        style={{ color: 'var(--color-brand)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(p.id)}
                                        style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Order Management</h2>
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
                                color: activeTab === 'COMPLETED' ? 'var(--color-success)' : 'var(--text-muted)'
                            }}
                        >
                            Sold {completedTransactions.length > 0 && `(${completedTransactions.length})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                background: activeTab === 'HISTORY' ? 'white' : 'transparent',
                                fontWeight: activeTab === 'HISTORY' ? 700 : 500,
                                boxShadow: activeTab === 'HISTORY' ? 'var(--shadow-sm)' : 'none',
                                color: activeTab === 'HISTORY' ? 'var(--text-main)' : 'var(--text-muted)'
                            }}
                        >
                            Refund {historyTransactions.length > 0 && `(${historyTransactions.length})`}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {displayedTransactions.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>No {activeTab.toLowerCase()} orders at the moment.</div>}
                    {displayedTransactions.map(t => (
                        <div key={t.id} className="card" style={{ borderLeft: `4px solid ${t.status === 'COMPLETED' ? '#10b981' : (t.status === 'DISPUTED' || t.status === 'REFUNDED') ? '#ef4444' : t.status === 'RETURNED' ? '#3b82f6' : '#f59e0b'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{t.product?.name || 'Unknown Product'}</h4>
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>Customer: <strong>{t.buyer?.fullName || 'Guest User'}</strong> ({t.buyer?.phone || 'N/A'}) | Order #ID-{t.id}</p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-brand)' }}>GH₵{t.amount}</div>
                                        {t.deliveredAt && (
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📅 {new Date(t.deliveredAt).toLocaleDateString()}</div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        background: (!t.isPending && (t.status === 'COMPLETED' || t.status === 'DELIVERED')) ? '#dcfce7' : t.status === 'REFUNDED' ? '#fee2e2' : t.status === 'DISPUTED' ? '#fef3c7' : t.status === 'RETURNED' ? '#dbeafe' : '#fef9c3',
                                        color: (!t.isPending && (t.status === 'COMPLETED' || t.status === 'DELIVERED')) ? '#166534' : t.status === 'REFUNDED' ? '#991b1b' : t.status === 'DISPUTED' ? '#92400e' : t.status === 'RETURNED' ? '#1e40af' : '#854d0e'
                                    }}>
                                        {t.status === 'RETURNED' ? 'ITEM RECOVERED & REFUNDED' : (!t.isPending && (t.status === 'COMPLETED' || t.status === 'DELIVERED')) ? 'SALES FINALIZED' : t.status}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {t.agentId ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                            <span>🚚</span>
                                            <span style={{ fontSize: '0.875rem' }}>Delivery Managed by: <strong>{t.agent?.fullName || `Agent #${t.agentId}`}</strong></span>
                                        </div>
                                        <button
                                            onClick={() => setShowDeliveryDetails(t)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
                                        >
                                            {(t.status === 'REFUNDED' || t.status === 'RETURNED' || t.status === 'DISPUTED') ? 'View Return Details' : 'View Delivery Details'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                                        <select
                                            value={selectedAgentId[t.id] || ''}
                                            onChange={(e) => setSelectedAgentId({ ...selectedAgentId, [t.id]: e.target.value })}
                                            style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                        >
                                            <option value="">Choose a delivery agent...</option>
                                            {agents.map(a => <option key={a.id} value={a.id}>{a.fullName} ({a.email})</option>)}
                                        </select>
                                        <button
                                            onClick={() => handleAssignAgent(t.id)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.6rem 1.25rem' }}
                                        >
                                            Assign
                                        </button>
                                    </div>
                                )}

                                {(t.status === 'DISPUTED') && t.disputes?.[0]?.itemStatus !== 'RECEIVED' && (
                                    <button
                                        onClick={() => handleConfirmReturn(t.id)}
                                        className="btn"
                                        style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '0.5rem 1rem' }}
                                    >
                                        ✓ Confirm Return Received
                                    </button>
                                )}
                            </div>

                            {t.disputes && t.disputes.length > 0 && t.disputes[0].status === 'OPEN' && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff1f2', borderRadius: 'var(--radius-sm)', border: '1px solid #fecdd3' }}>
                                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#9f1239' }}>⚠️ Dispute Investigation In Progress</h5>
                                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                                        <strong>Initiator Reason:</strong> {t.disputes[0].reason}
                                    </p>

                                    {t.disputes[0].sellerResponse ? (
                                        <div style={{ padding: '0.75rem', background: 'white', borderRadius: '4px', border: '1px solid #fda4af' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#be123c', marginBottom: '0.25rem' }}>YOUR STATEMENT SUBMITTED:</div>
                                            <div style={{ fontSize: '0.875rem' }}>{t.disputes[0].sellerResponse}</div>
                                        </div>
                                    ) : (
                                        t.disputes[0].itemStatus === 'RECEIVED' ? (
                                            <div style={{ padding: '1rem', background: 'white', borderRadius: '4px', border: '1px solid #fda4af', fontSize: '0.875rem', color: '#9f1239' }}>
                                                <strong>Note:</strong> This dispute was raised after delivery. You cannot add a comment. Please wait for the admin to review and decide.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                <textarea
                                                    placeholder="Provide your side of the story to the admin..."
                                                    value={t.disputes?.[0] ? (responseFormData[t.disputes[0].id] || '') : ''}
                                                    onChange={(e) => t.disputes?.[0] && setResponseFormData({ ...responseFormData, [t.disputes[0].id]: e.target.value })}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #fda4af', minHeight: '80px' }}
                                                />
                                                <button
                                                    onClick={() => handleRespondDispute(t.disputes?.[0]?.id || 0)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                                                >
                                                    Submit Statement to Admin
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {showDeliveryDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', animation: 'scaleUp 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>
                                {(showDeliveryDetails.status === 'REFUNDED' || showDeliveryDetails.status === 'RETURNED' || showDeliveryDetails.status === 'DISPUTED')
                                    ? 'Return Details'
                                    : 'Delivery Details'}
                            </h2>
                            <button onClick={() => setShowDeliveryDetails(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Product</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{showDeliveryDetails.product?.name || 'Unknown Product'}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Agent Name</div>
                                    <div style={{ fontWeight: 600 }}>{showDeliveryDetails.agent?.fullName || 'Not available'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Agent Phone</div>
                                    <div style={{ fontWeight: 600 }}>{showDeliveryDetails.agent?.phone || 'Not available'}</div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    {(showDeliveryDetails.status === 'REFUNDED' || showDeliveryDetails.status === 'RETURNED' || showDeliveryDetails.status === 'DISPUTED')
                                        ? '📍 Pick Up Location (Buyer)'
                                        : '📍 Delivery Location'}
                                </div>
                                <div style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                    <strong>Address:</strong> {showDeliveryDetails.deliveryAddress || 'N/A'}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {showDeliveryDetails.buyerLat && showDeliveryDetails.buyerLng && (
                                        <a
                                            href={`https://www.google.com/maps?q=${showDeliveryDetails.buyerLat},${showDeliveryDetails.buyerLng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ fontSize: '0.75rem', color: 'var(--color-brand)', fontWeight: 700, textDecoration: 'none' }}
                                        >
                                            🗺️ VIEW TARGET MAP
                                        </a>
                                    )}
                                    {showDeliveryDetails.agentLat && showDeliveryDetails.agentLng && (
                                        <a
                                            href={`https://www.google.com/maps?q=${showDeliveryDetails.agentLat},${showDeliveryDetails.agentLng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700, textDecoration: 'none' }}
                                        >
                                            📍 VIEW DELIVERY MAP
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                                    <div style={{ fontWeight: 800, color: showDeliveryDetails.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-brand)' }}>
                                        {(() => {
                                            const s = showDeliveryDetails.status;
                                            if (s === 'COMPLETED') return 'ITEM DELIVERED';
                                            if (s === 'RETURNED' || s === 'REFUNDED') return 'ITEM RECOVERED & REFUNDED';
                                            if (s === 'DISPUTED') return 'RETURNING TO YOU';
                                            return 'IN TRANSIT';
                                        })()}
                                    </div>
                                </div>
                                <span style={{ fontSize: '1.5rem' }}>
                                    {(['COMPLETED', 'RETURNED', 'REFUNDED'].includes(showDeliveryDetails.status)) ? '✅' : '🚚'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowDeliveryDetails(null)}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '2rem' }}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
