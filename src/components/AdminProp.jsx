import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminProp.css';
import './AdminDash.css';
import { FaHome, FaUsers, FaBuilding, FaMoneyBillWave, FaLandmark, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaBars } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db } from '../firebase';
import { ref, set, onValue, remove, update, push } from 'firebase/database';
import { toast } from 'react-toastify';
import PaymentModal from './PaymentModal';

// Helper to race a promise with a timeout
const withTimeout = (promise, ms, message = 'Operation timed out') => {
	let t;
	const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(message)), ms); });
	return Promise.race([promise.finally(() => clearTimeout(t)), timeout]);
};

export default function AdminProp() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [form, setForm] = useState({
        name: '',
        city: '',
        price: '',
        propertyType: 'house',
        listingType: 'sale',
        description: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        sizeUnit: 'sqm',
        mainImage: '', // URL or will be set to data URL
        landTitle: ''
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [landTitleFile, setLandTitleFile] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const CAMEROON_CITIES = [
        'Bamenda','Bafoussam','Bertoua','Buea','Douala','Ebolowa','Edea','Foumban','Garoua','Kousseri','Kribi','Kumba','Limbe','Maroua','Ngaoundere','Nkongsamba','Sangmelima','Yaounde','Tiko','Mamfe','Banyo','Batouri','Koutaba','Mbalmayo','Obala','Meiganga','Yagoua','Wum'
    ];

    useEffect(() => {
        const propertiesRef = ref(db, 'properties');
        console.log('Setting up Firebase listener for properties...');
        
        const off = onValue(propertiesRef, (snap) => {
            const data = snap.val() || {};
            console.log('Firebase data received:', data);
            
            const list = Object.entries(data).map(([id, p]) => ({ id, ...p }))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            console.log('Processed properties list:', list);
            setProperties(list);
            setIsLoading(false);
            
            if (list.length > 0) {
                toast.success(`Loaded ${list.length} property${list.length !== 1 ? 'ies' : 'y'} successfully`);
            }
        }, (error) => {
            console.error('Error fetching properties:', error);
            toast.error('Failed to load properties');
            setIsLoading(false);
        });
        
        return () => off();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        setImageFile(file || null);
    };

    const handleLandTitleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && !file.type?.startsWith('image/')) {
            toast.error('Please select an image file for Land Title');
            setLandTitleFile(null);
            return;
        }
        setLandTitleFile(file || null);
    };

    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!form.name.trim() || !form.city.trim() || !form.price) {
            toast.error('Please provide Name, City and Price');
            return;
        }
        
        // For new properties, show payment modal first
        if (!editId) {
            setShowPaymentModal(true);
            return;
        }
        
        // For editing existing properties, proceed directly
        await saveProperty();
    };

    const saveProperty = async () => {
        try {
            setIsSubmitting(true);
            const timestamp = Date.now();
            const id = editId || `prop_${timestamp}_${Math.random().toString(36).slice(2,8)}`;

            let mainImageFinal = form.mainImage?.trim() || '';
            if (!mainImageFinal && imageFile) {
                try {
                    mainImageFinal = await withTimeout(fileToDataUrl(imageFile), 15000, 'Image read timed out');
                } catch (_) {
                    // fallback stays empty
                }
            }

            let landTitleFinal = form.landTitle?.trim() || '';
            if (landTitleFile) {
                try {
                    landTitleFinal = await withTimeout(fileToDataUrl(landTitleFile), 15000, 'Land title image read timed out');
                } catch (_) {
                    // fallback stays as is
                }
            }

            const payload = {
                name: form.name.trim(),
                city: form.city.trim(),
                location: form.city.trim(),
                price: Number(form.price),
                propertyType: form.propertyType,
                listingType: form.listingType,
                type: form.listingType,
                description: form.description,
                bedrooms: Number(form.bedrooms)||0,
                bathrooms: Number(form.bathrooms)||0,
                area: Number(form.area)||0,
                sizeUnit: form.sizeUnit,
                mainImage: mainImageFinal || null,
                landTitle: landTitleFinal || null,
                isVerified: false,
                status: 'listed',
                createdAt: editId ? undefined : timestamp,
                updatedAt: timestamp,
                lastModifiedAt: timestamp,
                lastModifiedBy: 'admin',
                // Add platform fee information for admin properties (no fee required)
                platformFee: {
                    amount: 0, // Admin properties have no platform fee
                    status: 'completed', // Admin properties are automatically completed
                    paymentMethod: 'Admin Creation',
                    paidAt: timestamp,
                    transactionId: `admin_${timestamp}`,
                    isAdminCreated: true
                }
            };

            const writePromise = editId
                ? update(ref(db, `properties/${id}`), (({ createdAt, ...rest }) => rest)(payload))
                : set(ref(db, `properties/${id}`), payload);

            await withTimeout(writePromise, 15000, 'Saving to database timed out');

            toast.success(editId ? 'Property updated successfully' : 'Property created successfully', { autoClose: 1500 });

            // Reset form state
            setForm({ name: '', city: '', price: '', propertyType: 'house', listingType: 'sale', description: '', bedrooms: '', bathrooms: '', area: '', sizeUnit: 'sqm', mainImage: '', landTitle: '' });
            setImageFile(null);
            setLandTitleFile(null);
            setEditId(null);
            setShowForm(false);
        } catch (err) {
            toast.error(err.message || 'Failed to create property');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentSuccess = async () => {
        await saveProperty();
        setShowPaymentModal(false);
    };

    const getPropertyDataForPayment = () => {
        const timestamp = Date.now();
        const id = `prop_${timestamp}_${Math.random().toString(36).slice(2,8)}`;
        return {
            id,
            name: form.name.trim(),
            city: form.city.trim(),
            landlordId: 'admin',
            landlordName: 'Admin',
            isAdminCreated: true
        };
    };

    const startEdit = (prop) => {
        setEditId(prop.id);
        setForm({
            name: prop.name || '',
            city: prop.city || prop.location || '',
            price: prop.price || '',
            propertyType: prop.propertyType || 'house',
            listingType: prop.listingType || prop.type || 'sale',
            description: prop.description || '',
            bedrooms: prop.bedrooms || '',
            bathrooms: prop.bathrooms || '',
            area: prop.area || '',
            sizeUnit: prop.sizeUnit || 'sqm',
            mainImage: prop.mainImage || '',
            landTitle: prop.landTitle || prop.landTitleImage || ''
        });
        setImageFile(null);
        setLandTitleFile(null);
        setShowForm(true);
    };

    const cancelEdit = () => {
        setEditId(null);
        setForm({ name: '', city: '', price: '', propertyType: 'house', listingType: 'sale', description: '', bedrooms: '', bathrooms: '', area: '', sizeUnit: 'sqm', mainImage: '', landTitle: '' });
        setImageFile(null);
        setLandTitleFile(null);
        setShowForm(false);
    };

    const deleteProperty = async (id) => {
        if (!window.confirm('Delete this property?')) return;
        await remove(ref(db, `properties/${id}`));
        toast.success('Property deleted');
  };

    const toggleVerification = async (property) => {
        const newVerificationStatus = !property.isVerified;
        try {
            await update(ref(db, `properties/${property.id}`), {
                isVerified: newVerificationStatus,
                updatedAt: Date.now(),
                lastModifiedAt: Date.now(),
                lastModifiedBy: 'admin'
            });
            toast.success(`Property ${newVerificationStatus ? 'verified' : 'unverified'} successfully`);
        } catch (err) {
            toast.error(`Failed to update verification status: ${err.message}`);
        }
    };

  return (
    <div className="admin-dashboard">
            {mobileMenuOpen && <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />}
            <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="logo-section">
                    <img src={logo} alt="ITT Real Estate Logo" />
          <span>ITT Real Estate</span>
        </div>
        <nav className="nav-menu">
          <div className="menu-items">
            <Link to="/admin" className="nav-item">
              <FaHome /> Dashboard
            </Link>
            <Link to="/admin/users" className="nav-item">
              <FaUsers /> Users
            </Link>
            <Link to="/admin/properties" className="nav-item active">
              <FaBuilding /> Properties
            </Link>
            <Link to="/admin/verification" className="nav-item">
              <FaCheckCircle /> Verification
            </Link>
            <Link to="/admin/transactions" className="nav-item">
              <FaMoneyBillWave /> Transactions
            </Link>
            <Link to="/admin/government" className="nav-item last-item">
              <FaLandmark /> Government
            </Link>
          </div>
          <div className="mobile-menu-footer">
            <ProfileCircle />
            <LogoutButton />
          </div>
        </nav>
      </aside>
      <main className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Properties</h1>
          <div className="header-actions">
            <button className="menu-toggle" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Toggle menu">
            <FaBars />
            </button>
            <div className="desktop-profile">
              <ProfileCircle />
            </div>
            <div className="desktop-logout">
              <LogoutButton />
            </div>
          </div>
        </div>
        <section className="content-section">
                    {!showForm && (
                        <button className="action-button primary-button" onClick={() => setShowForm(true)}>
                            Create Property
              </button>
                    )}
                    {showForm && (
                        <form className="property-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <label>Name*</label>
                                <input name="name" value={form.name} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>City*</label>
                                <input list="cm-cities" name="city" value={form.city} onChange={handleChange} placeholder="Select or type a city" />
                                <datalist id="cm-cities">
                                    {CAMEROON_CITIES.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="form-row">
                                <label>Price (XAF)*</label>
                                <input type="number" name="price" value={form.price} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Property Type</label>
                                <select name="propertyType" value={form.propertyType} onChange={handleChange}>
                                    <option value="house">House</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="land">Land</option>
                                    <option value="villa">Villa</option>
                                    <option value="commercial">Commercial</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Listing Type</label>
                                <select name="listingType" value={form.listingType} onChange={handleChange}>
                                    <option value="sale">For Sale</option>
                                    <option value="rent">For Rent</option>
                                    <option value="pledge">Pledge</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Bedrooms</label>
                                <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Bathrooms</label>
                                <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Area</label>
                                <input type="number" name="area" value={form.area} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Size Unit</label>
                                <select name="sizeUnit" value={form.sizeUnit} onChange={handleChange}>
                                    <option value="sqm">Square Meters</option>
                                    <option value="sqft">Square Feet</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <label>Main Image</label>
                                <input name="mainImage" placeholder="Paste image URL (optional)" value={form.mainImage} onChange={handleChange} />
                            </div>
                            <div className="form-row">
                                <label>Or Select File</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="form-row">
                                <label>Land Title (image only)</label>
                                <input type="file" accept="image/*" onChange={handleLandTitleFileChange} />
                            </div>
                            <div className="form-row">
                                <label>Description</label>
                                <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="action-button secondary-button" onClick={cancelEdit} disabled={isSubmitting}>{editId ? 'Cancel Edit' : 'Cancel'}</button>
                                <button type="submit" className="action-button primary-button" disabled={isSubmitting}>{isSubmitting ? (editId ? 'Saving...' : 'Creating...') : (editId ? 'Save Changes' : 'Create')}</button>
                            </div>
                        </form>
                    )}

                    {/* Properties Table */}
                    <div className="table-wrapper" style={{ marginTop: '1rem', overflowX: 'auto' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Loading properties...</div>
                                <div style={{ fontSize: '0.9rem' }}>Please wait while we fetch your properties</div>
                            </div>
                        ) : properties.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No properties found</div>
                                <div style={{ fontSize: '0.9rem' }}>Create your first property using the button above</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                                    Showing {properties.length} property{properties.length !== 1 ? 'ies' : 'y'}
                                </div>
                                <table className="properties-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th>Name</th>
                                            <th>City</th>
                                            <th>Price</th>
                                            <th>Type</th>
                                            <th>Listing</th>
                                            <th>Status</th>
                                            <th>Verified</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {properties.map((p) => (
                                            <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                                                <td data-label="Name">{p.name}</td>
                                                <td data-label="City">{p.city || p.location}</td>
                                                <td data-label="Price">{Number(p.price || 0).toLocaleString('en-US')} XAF</td>
                                                <td data-label="Type">{p.propertyType}</td>
                                                <td data-label="Listing">{p.listingType || p.type}</td>
                                                <td data-label="Status">{p.status}</td>
                                                <td data-label="Verified">
                                                    <span className={`verification-status ${p.isVerified ? 'verified' : 'not-verified'}`}>
                                                        {p.isVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                                                        {p.isVerified ? 'Verified' : 'Not Verified'}
                                                    </span>
                                                </td>
                                                <td data-label="Actions">
                                                    <button className="table-action-btn edit-btn" title="Edit" onClick={() => startEdit(p)}><FaEdit /></button>
                                                    <button className="table-action-btn delete-btn" title="Delete" onClick={() => deleteProperty(p.id)}><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
        </section>
      </main>
      {showPaymentModal && (
            <PaymentModal 
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)} 
                onSuccess={handlePaymentSuccess}
                propertyData={getPropertyDataForPayment()}
            />
        )}
    </div>
  );
}

