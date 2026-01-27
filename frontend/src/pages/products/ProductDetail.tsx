import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, Product } from '../../services/product.service';
import { createTransaction } from '../../services/transaction.service';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [transaction, setTransaction] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [buyerLocation, setBuyerLocation] = useState<{ lat: number, lng: number } | null>(null);

    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    // Map logic
    useEffect(() => {
        if (isCheckoutModalOpen) {
            // Wait for modal to render
            setTimeout(() => {
                const mapContainer = document.getElementById('checkout-map');
                if (!mapContainer || !(window as any).L || mapRef.current) return;

                // Default to Ghana if no location
                const initialLat = buyerLocation?.lat || 5.6037;
                const initialLng = buyerLocation?.lng || -0.1870;

                mapRef.current = (window as any).L.map('checkout-map').setView([initialLat, initialLng], 13);

                (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(mapRef.current);

                // Add Search
                const L = (window as any).L;
                if (L && L.Control && L.Control.geocoder) {
                    const searchControl = L.Control.geocoder({
                        query: '',
                        placeholder: 'Search for neighborhood...',
                        defaultMarkGeocode: false,
                        collapsed: false,
                        position: 'topright'
                    }).on('markgeocode', function (e: any) {
                        const bbox = e.geocode.bbox;
                        const poly = L.polygon([
                            [bbox.getSouthEast().lat, bbox.getSouthEast().lng],
                            [bbox.getNorthEast().lat, bbox.getNorthEast().lng],
                            [bbox.getNorthWest().lat, bbox.getNorthWest().lng],
                            [bbox.getSouthWest().lat, bbox.getSouthWest().lng]
                        ]);
                        mapRef.current.fitBounds(poly.getBounds());

                        const latlng = e.geocode.center;
                        if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
                        markerRef.current = L.marker(latlng, { draggable: true }).addTo(mapRef.current);
                        setBuyerLocation({ lat: latlng.lat, lng: latlng.lng });

                        markerRef.current.on('dragend', function (event: any) {
                            const position = event.target.getLatLng();
                            setBuyerLocation({ lat: position.lat, lng: position.lng });
                        });
                    }).addTo(mapRef.current);
                } else {
                    console.error('Leaflet Geocoder not found in window.L');
                }

                // Add existing marker
                if (buyerLocation && !markerRef.current) {
                    markerRef.current = (window as any).L.marker([buyerLocation.lat, buyerLocation.lng], { draggable: true }).addTo(mapRef.current);
                    markerRef.current.on('dragend', function (event: any) {
                        const position = event.target.getLatLng();
                        setBuyerLocation({ lat: position.lat, lng: position.lng });
                    });
                }

                // Click to Pin
                mapRef.current.on('click', (e: any) => {
                    if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
                    markerRef.current = (window as any).L.marker(e.latlng, { draggable: true }).addTo(mapRef.current);
                    setBuyerLocation({ lat: e.latlng.lat, lng: e.latlng.lng });

                    markerRef.current.on('dragend', function (event: any) {
                        const position = event.target.getLatLng();
                        setBuyerLocation({ lat: position.lat, lng: position.lng });
                    });
                });
            }, 100);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
    }, [isCheckoutModalOpen]);

    useEffect(() => {
        if (id) loadProduct(Number(id));
    }, [id]);

    const loadProduct = async (productId: number) => {
        try {
            const data = await getProductById(productId);
            setProduct(data);
        } catch (error) {
            console.error('Error loading product');
        } finally {
            setLoading(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setBuyerLocation({ lat, lng });

                if (mapRef.current) {
                    mapRef.current.setView([lat, lng], 16);
                    if (markerRef.current) mapRef.current.removeLayer(markerRef.current);

                    markerRef.current = (window as any).L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
                    markerRef.current.on('dragend', function (event: any) {
                        const pos = event.target.getLatLng();
                        setBuyerLocation({ lat: pos.lat, lng: pos.lng });
                    });
                }
            },
            () => {
                alert("Unable to retrieve your location. You can still provide a textual address or pick manually on the map.");
            }
        );
    };

    const handleBuy = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setIsCheckoutModalOpen(true);
    };

    const handleConfirmPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !product) return;
        if (!deliveryAddress) return alert("Please provide a delivery address");

        try {
            const created = await createTransaction({
                buyerId: user.id,
                sellerId: product.sellerId,
                productId: product.id,
                amount: product.price,
                deliveryAddress,
                buyerLat: buyerLocation?.lat,
                buyerLng: buyerLocation?.lng
            });
            setTransaction(created);
            setIsCheckoutModalOpen(false);
            setShowModal(true);
        } catch (error) {
            alert('Transaction failed');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        navigate('/dashboard/buyer');
    };

    if (loading) return <LoadingSpinner message="Loading Product Details..." />;
    if (!product) return <div>Product not found</div>;

    return (
        <div className="page-container" style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 400px', gap: '3rem', alignItems: 'start' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ height: '500px', width: '100%', backgroundColor: 'var(--color-surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: '6rem' }}>📦</span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', lineHeight: 1.1, marginBottom: '1rem' }}>{product.name}</h1>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-brand)' }}>GH₵{product.price}</div>
                            <span style={{ padding: '4px 12px', background: 'var(--color-brand-surface)', color: 'var(--color-brand)', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 700 }}>
                                IN STOCK
                            </span>
                        </div>
                        <div className="card" style={{ background: 'var(--color-surface-muted)', border: 'none' }}>
                            <p style={{ fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>{product.description}</p>
                        </div>
                    </div>

                    <div className="card" style={{ border: 'none', background: 'var(--color-brand-surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-brand)' }}>
                                {product.seller?.fullName.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-muted)' }}>Verified Seller</div>
                                <div style={{ fontWeight: 700 }}>{product.seller?.fullName}</div>
                            </div>
                        </div>

                        {user?.role === 'BUYER' && (
                            <button
                                onClick={handleBuy}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem' }}
                            >
                                Secure Buy with Escrow 🛡️
                            </button>
                        ) || (
                                <p style={{ textAlign: 'center', margin: 0, fontSize: '0.875rem' }}>
                                    Please sign in as a Buyer to purchase.
                                </p>
                            )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', justifyContent: 'center' }}>
                        <span>🔒</span> 100% Secure Transaction
                    </div>
                </div>
            </div>

            {isCheckoutModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ maxWidth: '480px', width: '90%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Step 1: Delivery Info</h2>
                            <button onClick={() => setIsCheckoutModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleConfirmPurchase}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delivery Address</label>
                                <textarea
                                    placeholder="House number, Street, City..."
                                    value={deliveryAddress}
                                    onChange={e => setDeliveryAddress(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', minHeight: '80px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>GPS Location (Optional)</span>
                                    {buyerLocation && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', fontWeight: 700 }}>✅ PINNED</span>}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Help the agent find you faster by pinning your exact location.
                                </p>
                                <button type="button" onClick={handleGetLocation} className="btn" style={{ width: '100%', background: 'white', border: '1px solid var(--border)', padding: '0.5rem', marginBottom: '1rem' }}>
                                    📍 {buyerLocation ? 'Update GPS Pin' : 'Get Current Location'}
                                </button>

                                <div id="checkout-map" style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', zIndex: 1 }}></div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                                Confirm & Pay GH₵{product.price}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showModal && transaction && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Order Placed!</h2>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
                            Your funds are now securely held in escrow. You'll be notified as soon as a delivery agent is assigned to your order.
                        </p>
                        <button onClick={closeModal} className="btn btn-primary" style={{ width: '100%' }}>
                            Go to My Purchases
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 900px) {
                    div[style*="grid-template-columns: minmax(300px, 1fr) 400px"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductDetail;
