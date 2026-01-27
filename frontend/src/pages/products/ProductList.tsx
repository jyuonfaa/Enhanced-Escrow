import React, { useEffect, useState } from 'react';
import { getProducts, Product } from '../../services/product.service';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProductList: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading Marketplace..." />;
    }

    return (
        <div className="page-container">
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Global Marketplace</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem' }}>
                    Secure escrow-protected trading for professional goods and services.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {products.map(p => (
                    <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ height: '200px', backgroundColor: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '3.3rem' }}>📦</span>
                            )}
                        </div>
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{p.name}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    {p.description.substring(0, 100)}{p.description.length > 100 ? '...' : ''}
                                </p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand)' }}>
                                    GH₵{p.price}
                                </div>
                                <button
                                    onClick={() => navigate(`/products/${p.id}`)}
                                    className="btn btn-primary"
                                    style={{ padding: '0.6rem 1.25rem' }}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductList;
