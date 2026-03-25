import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ServicePayment() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    phone: ""
  });
  const [depositAmount] = useState(100); // Service fee amount
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // PayHero API configuration
  const PAYHERO_API_BASE = 'https://backend.payhero.co.ke/api/v2';
  const AUTH_TOKEN = 'Basic bnhvR1cxSVZqMFVoVVNHMmtTc3A6czFmcFF0NFRJa0lreFowYXZVWjdkRDRkdHJKeUtRaUxldjdoVVZVTw==';
  const CHANNEL_ID = 6415; // Co-operative Bank channel for M-Pesa

  useEffect(() => {
    // Get user phone number from form data
    const storedData = localStorage.getItem('crbCheckData');
    if (storedData) {
      const formData = JSON.parse(storedData);
      setUserData(prev => ({
        ...prev,
        phone: formData.phoneNumber || ""
      }));
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Format phone number to handle various input formats
  const formatPhoneNumber = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    
    if (p.startsWith("0")) {
      return p; // Return as is: 07XXXXXXXX
    }
    if (p.startsWith("7") || p.startsWith("1")) {
      return "0" + p;
    }
    if (p.startsWith("254")) {
      return "0" + p.substring(3);
    }
    return p;
  };

  // Check transaction status
  const checkTransactionStatus = async (reference) => {
    try {
      const response = await fetch(`${PAYHERO_API_BASE}/transaction-status?reference=${reference}`, {
        headers: {
          'Authorization': AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - check your auth token');
          return { status: 'PENDING' };
        }
        return { status: 'PENDING' };
      }
      
      const data = await response.json();
      console.log('Transaction status:', data);
      return data;
    } catch (error) {
      console.error('Status check error:', error);
      return { status: 'PENDING' };
    }
  };

  // Poll for transaction status
  const pollTransactionStatus = (reference, amount, phone) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 5 seconds = 2.5 minutes max
    let interval;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollingInterval(null);
        setIsProcessing(false);
        
        Swal.fire({
          title: "Payment Timeout",
          html: `
            <div style="text-align: center;">
              <i class="fas fa-clock" style="font-size: 48px; color: #f59e0b;"></i>
              <h3 style="margin: 15px 0;">Payment Not Completed</h3>
              <p>We haven't received confirmation of your payment.</p>
              <p>Please check your M-Pesa transaction history.</p>
              <p style="font-size: 0.9rem; color: #666;">Reference: ${reference}</p>
            </div>
          `,
          icon: "warning",
          confirmButtonText: "Try Again",
        });
        return;
      }

      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}`);

      try {
        const statusData = await checkTransactionStatus(reference);
        
        // Check if payment was successful
        if (statusData.success && statusData.status === "SUCCESS") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessing(false);
          
          // Store payment verification
          localStorage.setItem('crbPaymentVerified', 'true');
          
          Swal.fire({
            title: "Payment Successful! 🎉",
            html: `
              <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                <h3 style="margin: 15px 0;">KSh ${amount} Paid</h3>
                <p>Service fee payment completed successfully</p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                  Reference: ${reference}
                </p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "View Results",
          }).then(() => {
            navigate("/credit-check-status");
          });
          return;
        }
        
        // If payment failed
        if (statusData.status === "FAILED") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessing(false);
          
          Swal.fire({
            title: "Payment Failed",
            html: "❌ The payment was not completed. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
          });
          return;
        }
        
        // If still QUEUED or PENDING, continue polling
        console.log(`Payment status: ${statusData.status}, attempt ${attempts}/${maxAttempts}`);
        
      } catch (error) {
        console.log('Polling attempt', attempts, 'failed, continuing...');
        // Continue polling - don't show error
      }
    };

    // Check every 5 seconds
    interval = setInterval(checkStatus, 5000);
    setPollingInterval(interval);
    
    return interval;
  };

  // Initiate M-Pesa STK Push payment
  const initiatePayment = async () => {
    if (!userData.phone) {
      Swal.fire({
        title: "Phone Number Required",
        text: "Please complete the CRB check form first to provide your phone number",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return false;
    }

    const formattedPhone = formatPhoneNumber(userData.phone);
    const externalReference = `CRB-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    try {
      const response = await fetch(`${PAYHERO_API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': AUTH_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: depositAmount,
          phone_number: formattedPhone,
          channel_id: CHANNEL_ID,
          provider: 'm-pesa',
          external_reference: externalReference,
          customer_name: userData.name || 'CRB Checker User'
        })
      });

      const data = await response.json();
      console.log('Payment initiation response:', data);

      if (data.success) {
        return {
          success: true,
          reference: data.reference || externalReference,
          message: "STK Push sent successfully"
        };
      } else {
        throw new Error(data.error_message || "Payment initiation failed");
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const handlePayment = async () => {
    if (!userData.phone) {
      Swal.fire({
        title: "Phone Number Required",
        text: "Please complete the CRB check form first to provide your phone number",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    // Confirmation modal
    const { value: confirmed } = await Swal.fire({
      title: "Confirm Service Fee Payment",
      html: `
        <div style="text-align: center;">
          <div style="background: var(--gradient); padding: 18px; border-radius: 16px 16px 0 0; color: white; margin: -20px -20px 20px -20px;">
            <div style="font-size: 36px; margin-bottom: 8px;"><i class="fas fa-credit-card"></i></div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Payment Details</div>
          </div>
          
          <div style="background: #f8f9ff; border-radius: 10px; padding: 14px; margin-bottom: 16px; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(0, 102, 0, 0.1);">
              <span style="color: #666;">Service Fee:</span>
              <span style="color: #10b981; font-weight: 700;">KSh ${depositAmount}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Phone Number:</span>
              <span style="color: #10b981; font-weight: 600;">${userData.phone}</span>
            </div>
          </div>
          
          <div style="background: rgba(5, 150, 105, 0.1); padding: 12px; border-radius: 8px; margin: 14px 0;">
            <i class="fas fa-info-circle" style="color: #059669; margin-right: 8px;"></i>
            <span style="font-size: 0.85rem; color: #059669;">This payment is required to view your CRB status results</span>
          </div>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proceed to M-Pesa",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
      focusConfirm: false,
      showCloseButton: true,
    });

    if (!confirmed) return;

    // Show loading
    Swal.fire({
      title: "Initiating Payment",
      html: "Connecting to M-Pesa...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    setIsProcessing(true);

    // Initiate payment
    const result = await initiatePayment();
    
    if (result.success) {
      // Close loading modal
      Swal.close();
      
      // Show STK Push instruction modal
      Swal.fire({
        title: "Check Your Phone",
        html: `
          <div style="text-align: center;">
            <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
            <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
            <p>Check your phone to authorize payment of <strong>KSh ${depositAmount}</strong></p>
            <p style="margin-top: 10px;"><small>Phone: ${formatPhoneNumber(userData.phone)}</small></p>
            <div style="background: #f8f9ff; padding: 12px; border-radius: 8px; margin-top: 15px; text-align: left;">
              <p style="font-size: 0.85rem; margin: 0;">
                <i class="fas fa-clock" style="color: #059669; margin-right: 8px;"></i>
                Waiting for payment confirmation...
              </p>
            </div>
            <p style="font-size: 0.8rem; color: #666; margin-top: 15px;">
              Reference: ${result.reference}
            </p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "I've Completed Payment",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((resultModal) => {
        if (resultModal.isConfirmed) {
          // Start polling for payment status
          pollTransactionStatus(result.reference, depositAmount, userData.phone);
        } else {
          // User cancelled
          setIsProcessing(false);
          Swal.fire({
            title: "Payment Cancelled",
            text: "You have cancelled the payment process.",
            icon: "info",
            confirmButtonText: "OK",
          });
        }
      });
    } else {
      Swal.fire({
        title: "Payment Initiation Failed",
        html: `
          <div style="text-align: center;">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626;"></i>
            <h3 style="margin: 15px 0;">Unable to Initiate Payment</h3>
            <p>${result.error || "Please check your network connection and try again."}</p>
            <div style="background: #fef2f2; padding: 12px; border-radius: 8px; margin-top: 15px;">
              <p style="font-size: 0.85rem; margin: 0; color: #991b1b;">
                <i class="fas fa-info-circle"></i> Ensure your phone number is correct and you have sufficient M-Pesa balance.
              </p>
            </div>
          </div>
        `,
        icon: "error",
        confirmButtonText: "Try Again",
      });
      setIsProcessing(false);
    }
  };

  return (
    <section className="checker-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container">
        <div className="section-title">
          <h2>Service Fee Payment</h2>
          <p>Complete the payment to view your CRB status report</p>
        </div>
        
        <div className="deposit-card">
          <div className="deposit-title">
            <i className="fas fa-lock" style={{ marginRight: '8px' }}></i>
            Secure Payment
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
                <strong>Phone Number:</strong> {userData.phone}
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
              <li><i className="fas fa-4"></i> Wait for confirmation and view your results</li>
            </ul>
          </div>

          <div style={{ 
            background: '#fff8e1', 
            padding: '12px', 
            borderRadius: '8px', 
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <i className="fas fa-shield-alt" style={{ color: '#f39c12', marginRight: '8px' }}></i>
            <span style={{ fontSize: '0.85rem', color: '#856404' }}>
              Your payment is secured and encrypted. We value your privacy.
            </span>
          </div>

          <button
            className="deposit-btn"
            onClick={handlePayment}
            disabled={isProcessing || !userData.phone}
          >
            <i className={`fas ${isProcessing ? 'fa-spinner fa-spin' : 'fa-mobile-alt'}`}></i>
            {isProcessing ? "Processing..." : "Pay with M-Pesa"}
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
              style={{ fontSize: '0.9rem', padding: '10px 20px' }}
            >
              <i className="fas fa-arrow-left"></i> Back to CRB Check
            </button>
          </div>
        </div>
      </div>

      {/* Add additional styles for the component */}
      <style>{`
        .amount-input label {
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--dark);
        }
        
        .deposit-card {
          animation: fadeInUp 0.5s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .mpesa-info ul li {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .mpesa-info ul li i {
          width: 20px;
          color: #059669;
        }
      `}</style>
    </section>
  );
}

export default ServicePayment;