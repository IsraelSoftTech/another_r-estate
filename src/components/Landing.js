import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, 
  FaMoneyCheckAlt, 
  FaShieldAlt, 
  FaTools, 
  FaSearch, 
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaStar,
  FaArrowRight,
  FaPhone,
  FaEnvelope,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaTimesCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Landing.css';
import logo from '../assets/logo.jpg';
import { db } from '../firebase';
import { ref, onValue, query, orderByChild, equalTo, limitToLast } from 'firebase/database';

const features = [
  { icon: <FaCheckCircle />, title: 'Verified Listings', desc: 'Every property is thoroughly verified and authenticated' },
  { icon: <FaMoneyCheckAlt />, title: 'Secure Transactions', desc: 'Blockchain-powered secure property transactions' },
  { icon: <FaShieldAlt />, title: 'Fraud Protection', desc: 'Advanced verification systems prevent fraud' },
  { icon: <FaTools />, title: 'Professional Services', desc: 'Connect with verified technicians and agents' }
];

const stats = [
  { number: '500+', label: 'Properties Sold' },
  { number: '1000+', label: 'Happy Clients' },
  { number: '50+', label: 'Expert Agents' },
  { number: '99%', label: 'Satisfaction Rate' }
];

const CACHE_KEY = 'properties_cache_v1';

function Landing() {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fast load: hydrate from localStorage cache immediately, then subscribe to RTDB
  useEffect(() => {
    let isMounted = true;
    // Hydrate from cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list)) {
          setProperties(list);
          setFilteredProperties(list);
          setLoading(false);
        }
      }
    } catch {}

    // Realtime limited query: all properties, latest 50
    const q = query(ref(db, 'properties'), limitToLast(50));
    const unsubscribe = onValue(q, (snap) => {
      if (!isMounted) return;
      const data = snap.val() || {};
      const list = Object.entries(data)
        .map(([id, p]) => ({ id, ...p }))
        // Removed status filter so that all properties show, even if status is missing
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setProperties(list);
      setFilteredProperties(list);
      setLoading(false);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
    }, (err) => {
      console.error('Landing: failed to subscribe properties', err);
      if (isMounted && properties.length === 0) {
        setError(err.message || 'Failed to load properties');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = properties.filter(p => (
      p.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.propertyType?.toLowerCase().includes(q)
    ));
    setFilteredProperties(filtered);
  }, [searchQuery, properties]);

  const openPropertyModal = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `XAF ${Number(price).toLocaleString()}`;
  };

  const getListingTypeText = (type) => {
    switch (type) {
      case 'sale': return 'For Sale';
      case 'rent': return 'For Rent';
      case 'pledge': return 'For Pledge';
      case 'lease': return 'For Lease';
      default: return 'For Sale';
    }
  };

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <img src={logo} alt="ITT Real Estate" className="logo-image" />
            <h1 className="company-name">ITT Real Estate</h1>
          </div>
          <motion.button
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/signin")}
          >
            Login
          </motion.button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">
              Discover Your Dream Property
            </h1>
            <p className="hero-subtitle">
              Experience the future of real estate with AI-powered verification, 
              blockchain security, and premium properties that meet the highest standards.
            </p>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-item"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search properties by name, location, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="properties-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Featured Properties</h2>
            <p className="section-subtitle">
              Discover our selection of properties with verification status
            </p>
          </motion.div>

          {loading && filteredProperties.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="no-properties">
              <p>No properties available at the moment.</p>
              <p>Please check back later or contact us for more information.</p>
            </div>
          ) : (
            <div className="properties-grid">
              <AnimatePresence>
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    className="property-card"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="property-image-container">
                      <img 
                        src={property.mainImage || 'https://via.placeholder.com/180x140?text=Property'} 
                        alt={property.name}
                        loading="lazy"
                        decoding="async"
                        className="property-image" 
                      />
                    </div>
                    
                    <div className="property-content">
                      <div className="property-title">{property.name}</div>
                      <div className="property-location">
                        <FaMapMarkerAlt />
                        <span>{property.location}</span>
                      </div>
                      
                      <div className="property-details">
                        {property.bedrooms > 0 && (
                          <div className="detail-item">
                            <FaBed />
                            <span>{property.bedrooms} Beds</span>
                          </div>
                        )}
                        {property.bathrooms > 0 && (
                          <div className="detail-item">
                            <FaBath />
                            <span>{property.bathrooms} Baths</span>
                          </div>
                        )}
                        {property.area > 0 && (
                          <div className="detail-item">
                            <FaRulerCombined />
                            <span>{property.area} {property.sizeUnit || 'sqm'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="property-price">{formatPrice(property.price)}</div>
                      
                      <motion.button
                        className="view-details-btn"
                        onClick={() => openPropertyModal(property)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        View Details
                        <FaArrowRight />
                      </motion.button>
                    </div>
                    
                    <div className="property-overlay">
                      <div className="property-status">{getListingTypeText(property.type)}</div>
                      <div className={`verification-badge ${property.isVerified ? 'verified' : 'not-verified'}`}>
                        {property.isVerified ? (
                          <>
                            <FaCheckCircle />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <FaTimesCircle />
                            <span>Not Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="property-rating">
                      <FaStar />
                      <span>4.8</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Why Choose Us</h2>
            <p className="section-subtitle">
              We're revolutionizing real estate with cutting-edge technology
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Get In Touch</h2>
            <p className="section-subtitle">
              Ready to find your dream property? Contact us today!
            </p>
          </motion.div>

          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <div>
                  <h4>Phone</h4>
                  <p>+237 123 456 789</p>
                </div>
              </div>
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <div>
                  <h4>Email</h4>
                  <p>info@ittrealestate.com</p>
                </div>
              </div>
              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <div>
                  <h4>Address</h4>
                  <p>Douala, Cameroon</p>
                </div>
              </div>
            </div>
            
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link"><FaFacebook /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link"><FaTwitter /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link"><FaInstagram /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link"><FaLinkedin /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <img src={logo} alt="ITT Real Estate" />
              <span>ITT Real Estate</span>
            </div>
            <p>Transforming real estate with AI & blockchain technology</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#properties">Properties</a>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-section">
            <h4>Services</h4>
            <a href="#properties">Property Sales</a>
            <a href="#properties">Property Rentals</a>
            <a href="#properties">Property Management</a>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 ITT Real Estate. All rights reserved.</p>
        </div>
      </footer>

      {/* Property Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="property-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeModal}>×</button>
              
              {selectedProperty && (
                <div className="modal-content">
                  <div className="modal-image-container">
                    <img 
                      src={selectedProperty.mainImage || 'https://via.placeholder.com/400x400?text=Property+Image'} 
                      alt={selectedProperty.name} 
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="modal-overlay-info">
                      <div className="modal-status">{getListingTypeText(selectedProperty.type)}</div>
                      {selectedProperty.isVerified && (
                        <div className="modal-verified">
                          <FaCheckCircle />
                          <span>Verified Property</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="modal-details">
                    <h2>{selectedProperty.name}</h2>
                    <div className="modal-location">
                      <FaMapMarkerAlt />
                      <span>{selectedProperty.location}</span>
                    </div>
                    
                    <div className="modal-specs">
                      {selectedProperty.bedrooms > 0 && (
                        <div className="spec-item">
                          <FaBed />
                          <span>{selectedProperty.bedrooms} Bedrooms</span>
                        </div>
                      )}
                      {selectedProperty.bathrooms > 0 && (
                        <div className="spec-item">
                          <FaBath />
                          <span>{selectedProperty.bathrooms} Bathrooms</span>
                        </div>
                      )}
                      {selectedProperty.area > 0 && (
                        <div className="spec-item">
                          <FaRulerCombined />
                          <span>{selectedProperty.area} {selectedProperty.sizeUnit || 'sqm'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="modal-price">{formatPrice(selectedProperty.price)}</div>
                    
                    <p className="modal-description">
                      {selectedProperty.description || 'No description available for this property.'}
                    </p>
                    
                    <div className="modal-actions">
                      <motion.button
                        className="modal-cta-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/signin")}
                      >
                        Contact Agent
                      </motion.button>
                      <motion.button
                        className="modal-secondary-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/signin")}
                      >
                        Schedule Viewing
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Landing; 