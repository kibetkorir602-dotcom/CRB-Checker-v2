import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ServicePaymentHashback() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ phone: "" });
  const [depositAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const wsRef = useRef(null);
  const currentCheckoutIdRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);

  // Use your published backend URL with proper protocol
  const BACKEND_URL = 'https://hash-back-server-production.up.railway.app'; // Add https://

  useEffect(() => {
    const storedData = localStorage.getItem('crbCheckData');
    if (storedData) {
      const formData = JSON.parse(storedData);
      setUserData(prev => ({ ...prev, phone: formData.phoneNumber || "" }));
    }
    
    // Try WebSocket connection (if your backend supports it)
    setupWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);

  const setupWebSocket = () => {
    // Use wss:// for secure WebSocket (if your backend supports it)
    // For Railway, WebSocket might not work if not configured
    try {
      wsRef.current = new WebSocket('wss://hash-back-server-production.up.railway.app');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket message:', message);
        
        if (message.type === 'payment_completed') {
          handlePaymentSuccess(message.data);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        // WebSocket might not be supported, fall back to polling
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.log('WebSocket not supported, using polling fallback');
    }
  };

  const formatPhoneForHashPay = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    
    if (p.startsWith("0")) {
      return p;
    }
    if (p.startsWith("7") || p.startsWith("1")) {
      return "0" + p;
    }
    if (p.startsWith("254")) {
      return "0" + p.substring(3);
    }
    return p;
  };

  const formatPhoneForDisplay = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    if (p.startsWith("254")) return "0" + p.substring(3);
    if (p.startsWith("0")) return p;
    if (p.startsWith("7")) return "0" + p;
    return p;
  };

  const handlePaymentSuccess = (data) => {
    setPaymentStatus('success');
    setIsProcessing(false);
    
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }
    
    localStorage.setItem('crbPaymentVerified', 'true');
    localStorage.setItem('paymentTransactionId', data.transactionId);
    
    Swal.fire({
      title: "Payment Successful! 🎉",
      html: `<div>KSh ${data.amount} paid successfully</div>
             <div>Transaction ID: ${data.transactionId}</div>`,
      icon: "success",
      confirmButtonText: "View Results",
    }).then(() => navigate("/credit-check-status"));
  };

  const checkPaymentStatus = async (checkoutId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/check-payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutId })
      });
      
      const data = await response.json();
      console.log('Status check:', data);
      
      if (data.status === 'completed') {
        // Payment successful
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
        }
        handlePaymentSuccess(data);
      } else if (data.status === 'failed') {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
        }
        Swal.close();
        Swal.fire({
          title: "Payment Failed",
          text: "The payment was not successful. Please try again.",
          icon: "error"
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const handlePayment = async () => {
    if (!userData.phone) {
      Swal.fire({ 
        title: "Phone Required", 
        text: "Please complete CRB check first.", 
        icon: "warning" 
      });
      return;
    }

    const displayPhone = formatPhoneForDisplay(userData.phone);
    const hashPayPhone = formatPhoneForHashPay(userData.phone);
    
    if (!hashPayPhone.match(/^07[0-9]{8}$/)) {
      Swal.fire({ 
        title: "Invalid Phone Number", 
        text: `Phone number "${displayPhone}" is invalid. Must be a valid Kenyan number (e.g., 0712345678).`, 
        icon: "error" 
      });
      return;
    }

    const confirmed = await Swal.fire({
      title: "Confirm Service Fee Payment",
      html: `
        <div style="text-align: center">
          <p><strong>Amount:</strong> KSh ${depositAmount}</p>
          <p><strong>Phone:</strong> ${displayPhone}</p>
          <p><strong>Service:</strong> CRB Status Check</p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proceed to M-Pesa",
      cancelButtonText: "Cancel"
    });
    
    if (!confirmed.isConfirmed) return;

    Swal.fire({ 
      title: "Initiating Payment", 
      text: "Connecting to M-Pesa...", 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });
    
    setIsProcessing(true);

    try {
      const reference = `CRB-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      console.log('Initiating payment via backend:', `${BACKEND_URL}/api/initiate-payment`);
      
      const response = await fetch(`${BACKEND_URL}/api/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          phone: hashPayPhone,
          reference: reference,
          userId: localStorage.getItem('userId') || 'anonymous'
        })
      });

      const data = await response.json();
      console.log('Initiation response:', data);
      
      if (data.success && data.checkoutId) {
        currentCheckoutIdRef.current = data.checkoutId;
        
        // Register with WebSocket if available
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'register',
            checkoutId: data.checkoutId
          }));
        }
        
        Swal.close();
        Swal.fire({
          title: "Check Your Phone",
          html: `
            <div>
              <p>Enter M-Pesa PIN to pay KSh ${depositAmount}</p>
              <p><strong>Reference:</strong> ${reference}</p>
              <p>We'll automatically confirm your payment once completed.</p>
            </div>
          `,
          icon: "info",
          confirmButtonText: "I've Completed Payment",
          showCancelButton: true,
          cancelButtonText: "Cancel"
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Waiting for Confirmation",
              html: "Please wait while we confirm your payment...",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
            
            // Start polling for payment status every 5 seconds
            statusCheckIntervalRef.current = setInterval(() => {
              if (currentCheckoutIdRef.current) {
                checkPaymentStatus(currentCheckoutIdRef.current);
              }
            }, 5000);
            
            // Set timeout for payment confirmation (2 minutes)
            setTimeout(() => {
              if (paymentStatus !== 'success' && statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current);
                Swal.close();
                Swal.fire({
                  title: "Payment Not Confirmed",
                  text: "Payment confirmation timed out. Please check your M-Pesa statement or contact support.",
                  icon: "warning"
                });
                setIsProcessing(false);
              }
            }, 120000);
          } else {
            setIsProcessing(false);
          }
        });
      } else {
        console.error('Initiation response:', data);
        throw new Error(data.error || data.message || "Initiation failed");
      }
    } catch (error) {
      console.error('Payment error:', error);
      Swal.fire({ 
        title: "Payment Failed", 
        text: error.message || "Unable to initiate payment. Please try again.", 
        icon: "error" 
      });
      setIsProcessing(false);
    }
  };

  return (
    <section className="checker-section">
      <div className="container">
        <div className="section-title">
          <h2>Service Fee Payment</h2>
          <p>Complete the payment to view your CRB status report</p>
        </div>
        
        <div className="deposit-card">
          <div className="deposit-title">
            <i className="fas fa-lock" style={{ marginRight: '8px' }}></i>
            Secure Payment via HashPay
          </div>

          <div className="amount-input" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
              Service Fee Amount
            </label>
            <div style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#059669' }}>
                KSh {depositAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {userData.phone && (
            <div className="phone-info" style={{ 
              background: '#e8f5e9',
              padding: '15px',
              borderRadius: '10px',
              margin: '20px 0',
              textAlign: 'center',
              borderLeft: '4px solid #059669'
            }}>
              <p style={{ margin: 0 }}>
                <i className="fas fa-mobile-alt" style={{ marginRight: '8px', color: '#059669' }}></i>
                <strong>Phone Number:</strong> {formatPhoneForDisplay(userData.phone)}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '8px 0 0 0' }}>
                M-Pesa payment will be sent to this number
              </p>
            </div>
          )}

          <div className="mpesa-info">
            <h4>
              <i className="fas fa-info-circle"></i> How to Complete Payment
            </h4>
            <ul>
              <li><i className="fas fa-1"></i> Click "Pay with M-Pesa" button below</li>
              <li><i className="fas fa-2"></i> Check your phone for M-Pesa STK Push prompt</li>
              <li><i className="fas fa-3"></i> Enter your M-Pesa PIN to authorize payment</li>
              <li><i className="fas fa-4"></i> Payment will be automatically confirmed</li>
            </ul>
          </div>

          <button
            className="deposit-btn"
            onClick={handlePayment}
            disabled={isProcessing || !userData.phone}
            style={{
              background: isProcessing ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              cursor: (isProcessing || !userData.phone) ? 'not-allowed' : 'pointer'
            }}
          >
            <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-mobile-alt'}`}></i>
            {isProcessing ? "Processing..." : "Pay with M-Pesa via HashPay"}
          </button>
          
          {!userData.phone && (
            <div style={{ 
              color: '#dc3545', 
              textAlign: 'center', 
              marginTop: '15px', 
              fontSize: '0.9rem',
              padding: '12px',
              background: '#f8d7da',
              borderRadius: '8px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              Please complete the CRB check form first to provide your phone number
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate("/crb-check")}
              style={{ fontSize: '0.9rem', padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              <i className="fas fa-arrow-left"></i> Back to CRB Check
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServicePaymentHashback;