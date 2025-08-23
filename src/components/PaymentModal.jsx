import React, { useState, useEffect } from 'react';
import { FaTimes, FaCreditCard, FaMobile, FaMobileAlt, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { db, ensureAuthUser } from '../firebase';
import { ref, push, set } from 'firebase/database';

// Function to create property purchase/rental transactions
export const createPropertyTransaction = async (propertyData, buyerData, transactionType, amount) => {
  try {
    const transactionData = {
      propertyId: propertyData.id,
      propertyName: propertyData.name,
      landlordId: propertyData.landlordId,
      landlordName: propertyData.landlordName,
      buyerId: buyerData.id || buyerData.uid,
      buyerName: buyerData.name || buyerData.displayName || buyerData.email,
      buyerEmail: buyerData.email,
      buyerPhone: buyerData.phone,
      amount: amount,
      type: transactionType === 'sale' ? 'Property Sale' : 'Property Rental',
      transactionType: transactionType,
      status: 'pending', // Admin can approve
      timestamp: Date.now(),
      createdAt: Date.now(),
      description: `${transactionType === 'sale' ? 'Purchase' : 'Rental'} of ${propertyData.name}`,
      propertyDetails: {
        type: propertyData.propertyType,
        location: propertyData.city || propertyData.location,
        price: propertyData.price
      }
    };

    // Save transaction to database
    const transactionsRef = ref(db, 'transactions');
    const newTransactionRef = push(transactionsRef);
    await set(newTransactionRef, transactionData);

    console.log('Property transaction created successfully:', newTransactionRef.key);
    return newTransactionRef.key;
  } catch (error) {
    console.error('Error creating property transaction:', error);
    throw error;
  }
};

const PaymentModal = ({ isOpen, onClose, onSuccess, propertyData }) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [currentUser, setCurrentUser] = useState(null);

  const PLATFORM_FEE = 1000;

  useEffect(() => {
    if (isOpen) {
      ensureAuthUser().then(setCurrentUser);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if ((paymentMethod === 'mtn' || paymentMethod === 'orange') && !phoneNumber.trim()) {
      toast.error('Please enter your mobile money number');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !cardName.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    // Validate property data
    if (!propertyData || !propertyData.name) {
      toast.error('Property information is missing. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      console.log('Starting payment process...', { propertyData, paymentMethod });
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // For platform fees, we don't create separate transaction records
      // The fee information is integrated into the property record itself
      if (propertyData.isAdminCreated) {
        // Admin properties don't need platform fees
        setPaymentStatus('success');
        toast.success('Property created successfully!');
      } else {
        // Landlord properties - platform fee is integrated into property record
        setPaymentStatus('success');
        toast.success('Platform fee payment successful! Property will be created.');
      }
      
      // Wait a moment then close and proceed
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('failed');
      toast.error(`Payment failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod('');
    setPhoneNumber('');
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setPaymentStatus('pending');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{propertyData?.isAdminCreated ? 'Property Creation' : 'Platform Fee Payment'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {paymentStatus === 'pending' && (
            <>
              <div className="payment-info">
                {propertyData?.isAdminCreated ? (
                  <div className="fee-display">
                    <h3>Admin Property Creation</h3>
                    <div className="amount" style={{ color: '#059669' }}>No Fee Required</div>
                    <p>Create property directly without platform fee</p>
                  </div>
                ) : (
                  <div className="fee-display">
                    <h3>Platform Fee</h3>
                    <div className="amount">XAF {PLATFORM_FEE.toLocaleString()}</div>
                    <p>Pay this fee to upload your property to the platform</p>
                  </div>
                )}

                {!propertyData?.isAdminCreated && (
                  <div className="payment-methods">
                    <h4>Select Payment Method</h4>
                    
                    <div className="method-options">
                      <label className={`method-option ${paymentMethod === 'mtn' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="mtn"
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <FaMobile className="method-icon" style={{ color: '#FFC107' }} />
                          <span>MTN Mobile Money</span>
                        </div>
                      </label>

                      <label className={`method-option ${paymentMethod === 'orange' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="orange"
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <FaMobileAlt className="method-icon" style={{ color: '#FF8C00' }} />
                          <span>Orange Money</span>
                        </div>
                      </label>

                      <label className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <FaCreditCard className="method-icon" style={{ color: '#1e40af' }} />
                          <span>Credit/Debit Card</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {!propertyData?.isAdminCreated && paymentMethod === 'mtn' && (
                  <div className="payment-details">
                    <h4>MTN Mobile Money</h4>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter MTN number (e.g., 675123456)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        maxLength="12"
                      />
                    </div>
                    <div className="amount-display">
                      <span>Amount to pay:</span>
                      <strong>XAF {PLATFORM_FEE.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

                {!propertyData?.isAdminCreated && paymentMethod === 'orange' && (
                  <div className="payment-details">
                    <h4>Orange Money</h4>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter Orange number (e.g., 675123456)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        maxLength="12"
                      />
                    </div>
                    <div className="amount-display">
                      <span>Amount to pay:</span>
                      <strong>XAF {PLATFORM_FEE.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

                {!propertyData?.isAdminCreated && paymentMethod === 'card' && (
                  <div className="payment-details">
                    <h4>Credit/Debit Card</h4>
                    <div className="input-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength="19"
                      />
                    </div>
                    <div className="input-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                    <div className="card-row">
                      <div className="input-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength="5"
                        />
                      </div>
                      <div className="input-group">
                        <label>CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          maxLength="4"
                        />
                      </div>
                    </div>
                    <div className="amount-display">
                      <span>Amount to pay:</span>
                      <strong>XAF {PLATFORM_FEE.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {paymentStatus === 'processing' && (
            <div className="payment-processing">
              <div className="processing-icon">
                <FaSpinner className="spinner" />
              </div>
              <h3>Processing Payment</h3>
              <p>Please wait while we process your payment...</p>
              <div className="processing-steps">
                <div className="step">✓ Payment method selected</div>
                <div className="step">✓ Amount verified</div>
                <div className="step active">⏳ Waiting for approval</div>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="payment-success">
              <div className="success-icon">
                <FaCheckCircle />
              </div>
              <h3>Payment Confirmed!</h3>
              <p>Your payment has been processed successfully.</p>
              <div className="success-details">
                <div className="detail">
                  <span>Amount:</span>
                  <strong>XAF {PLATFORM_FEE.toLocaleString()}</strong>
                </div>
                <div className="detail">
                  <span>Method:</span>
                  <strong>{paymentMethod === 'mtn' ? 'MTN Mobile Money' : 
                          paymentMethod === 'orange' ? 'Orange Money' : 'Credit Card'}</strong>
                </div>
                <div className="detail">
                  <span>Status:</span>
                  <strong style={{ color: '#059669' }}>Completed</strong>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="payment-failed">
              <div className="failed-icon">
                <FaExclamationCircle />
              </div>
              <h3>Payment Failed</h3>
              <p>There was an issue processing your payment. Please try again.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {paymentStatus === 'pending' && (
            <>
              <button 
                className="action-button secondary-button" 
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="action-button primary-button" 
                onClick={handlePayment}
                disabled={isProcessing || (!propertyData?.isAdminCreated && !paymentMethod)}
              >
                {propertyData?.isAdminCreated ? 'Create Property' : 'Proceed to Payment'}
              </button>
            </>
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <button 
                className="action-button secondary-button" 
                onClick={() => setPaymentStatus('pending')}
              >
                Try Again
              </button>
              <button 
                className="action-button primary-button" 
                onClick={onClose}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 