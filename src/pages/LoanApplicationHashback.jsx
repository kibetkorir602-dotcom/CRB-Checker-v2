import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ServicePaymentHashback() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ phone: "" });
  const [depositAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  // HashPay Configuration
  const HASHPAY_API_KEY = 'h26520UMWO05P';
  const HASHPAY_ACCOUNT_ID = 'HP456097';
  const HASHPAY_INITIATE_URL = 'https://api.hashback.co.ke/initiatestk';
  const HASHPAY_STATUS_URL = 'https://api.hashback.co.ke/transactionstatus';

  useEffect(() => {
    const storedData = localStorage.getItem('crbCheckData');
    if (storedData) {
      const formData = JSON.parse(storedData);
      setUserData(prev => ({ ...prev, phone: formData.phoneNumber || "" }));
    }
  }, []);

  // CORRECTED: Format phone number to 07XXXXXXXX format (what HashPay expects)
  const formatPhoneForHashPay = (phone) => {
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

  const formatPhoneForDisplay = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    if (p.startsWith("254")) return "0" + p.substring(3);
    if (p.startsWith("0")) return p;
    if (p.startsWith("7")) return "0" + p;
    return p;
  };

  const checkTransactionStatus = async (checkoutId) => {
    try {
      const response = await fetch(HASHPAY_STATUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: HASHPAY_API_KEY,
          account_id: HASHPAY_ACCOUNT_ID,
          checkoutid: checkoutId
        })
      });
      const data = await response.json();
      console.log('Status check response:', data);
      // Check if ResultCode is "0" meaning success
      return data.ResultCode === "0";
    } catch (error) {
      console.error('Status check error:', error);
      return false;
    }
  };

  const pollTransactionStatus = (checkoutId, amount, phone) => {
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes
    let interval;

    const checkStatus = async () => {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}`);
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        Swal.fire({ 
          title: "Timeout", 
          text: "Payment confirmation timed out. Please check your M-Pesa transaction history.", 
          icon: "warning" 
        });
        setIsProcessing(false);
        return;
      }
      
      const isSuccess = await checkTransactionStatus(checkoutId);
      if (isSuccess) {
        clearInterval(interval);
        localStorage.setItem('crbPaymentVerified', 'true');
        Swal.fire({
          title: "Payment Successful! 🎉",
          html: `<div style="text-align: center;">
            <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
            <h3 style="margin: 15px 0;">KSh ${amount} Paid</h3>
            <p>Service fee payment completed successfully</p>
          </div>`,
          icon: "success",
          confirmButtonText: "View Results",
        }).then(() => navigate("/credit-check-status"));
      }
    };

    interval = setInterval(checkStatus, 5000);
    return interval;
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
    
    console.log('Phone formatting:', {
      original: userData.phone,
      display: displayPhone,
      hashpay: hashPayPhone
    });
    
    // Validate phone format (should be 07XXXXXXXX - 10 digits starting with 0)
    if (!hashPayPhone.match(/^07[0-9]{8}$/)) {
      Swal.fire({ 
        title: "Invalid Phone Number", 
        text: `Phone number "${displayPhone}" is invalid. Must be a valid Kenyan number (e.g., 0712345678).`, 
        icon: "error" 
      });
      return;
    }

    // Confirmation modal
    const confirmed = await Swal.fire({
      title: "Confirm Service Fee Payment",
      html: `
        <div style="text-align: center;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 18px; border-radius: 16px 16px 0 0; color: white; margin: -20px -20px 20px -20px;">
            <div style="font-size: 36px; margin-bottom: 8px;"><i class="fas fa-credit-card"></i></div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Payment Details</div>
          </div>
          
          <div style="background: #f8f9ff; border-radius: 10px; padding: 14px; margin-bottom: 16px; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(5, 150, 105, 0.1);">
              <span style="color: #666;">Service Fee:</span>
              <span style="color: #059669; font-weight: 700;">KSh ${depositAmount}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Phone Number:</span>
              <span style="color: #059669; font-weight: 600;">${displayPhone}</span>
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
      
      const response = await fetch(HASHPAY_INITIATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: HASHPAY_API_KEY,
          account_id: HASHPAY_ACCOUNT_ID,
          amount: depositAmount.toString(),
          msisdn: hashPayPhone, // Now in 07XXXXXXXX format
          reference: reference
        })
      });

      const data = await response.json();
      console.log('HashPay response:', data);

      if (data.success && data.checkout_id) {
        Swal.close();
        
        Swal.fire({
          title: "Check Your Phone",
          html: `
            <div style="text-align: center;">
              <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
              <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
              <p>Check your phone to authorize payment of <strong>KSh ${depositAmount}</strong></p>
              <p style="margin-top: 10px;"><small>Phone: ${displayPhone}</small></p>
              <div style="background: #f8f9ff; padding: 12px; border-radius: 8px; margin-top: 15px;">
                <p style="font-size: 0.8rem; margin: 0; color: #666;">
                  Reference: ${reference}
                </p>
              </div>
            </div>
          `,
          icon: "info",
          confirmButtonText: "I've Completed Payment",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            // Start polling for payment status
            pollTransactionStatus(data.checkout_id, depositAmount, displayPhone);
          } else {
            setIsProcessing(false);
            Swal.fire({
              title: "Payment Cancelled",
              text: "You can complete the payment from your M-Pesa app.",
              icon: "info"
            });
          }
        });
      } else {
        throw new Error(data.message || "Initiation failed");
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
      <div className="containerr">
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
            margin: '15px 0',
            textAlign: 'center'
          }}>
            <i className="fas fa-shield-alt" style={{ color: '#f39c12', marginRight: '8px' }}></i>
            <span style={{ fontSize: '0.85rem', color: '#856404' }}>
              Your payment is secured and encrypted. We value your privacy.
            </span>
          </div>
          
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

      <style>{`
        .amount-input label {
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--dark);
        }
        
        .deposit-card {
          animation: fadeInUp 0.5s ease-out;
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
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
        
        .deposit-title {
          font-size: 1.2rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 15px;
          color: #333;
        }
        
        .mpesa-info {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 12px;
          margin: 15px 0;
        }
        
        .mpesa-info h4 {
          margin-bottom: 15px;
          color: #333;
          font-size: 1rem;
        }
        
        .mpesa-info ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .mpesa-info ul li {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          font-size: 0.9rem;
          color: #555;
        }
        
        .mpesa-info ul li i {
          width: 24px;
          height: 24px;
          background: #e8f5e9;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #059669;
          font-size: 0.8rem;
          font-style: normal;
        }
        
        .deposit-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .deposit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(5, 150, 105, 0.3);
        }
        
        .deposit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .btn-secondary:hover {
          opacity: 0.9;
        }
      `}</style>
    </section>
  );
}

export default ServicePaymentHashback;
