import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ServicePaymentHashback() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    phone: ""
  });
  const [depositAmount] = useState(100); // Service fee amount
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // HashPay API endpoint (your PHP backend)
  const HASHPAY_API_ENDPOINT = '/api/hashpay_stk.php'; // Update with your actual endpoint path

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

  /**
   * Format phone number for HashPay API (254XXXXXXXX format)
   * @param {string} phone - Raw phone number input
   * @returns {string} Formatted phone number for HashPay
   */
  const formatPhoneForHashPay = (phone) => {
    // Remove all non-digit characters
    let p = phone.toString().replace(/\D/g, "");
    
    // If it starts with 0, convert to 254 format
    if (p.startsWith("0")) {
      return "254" + p.substring(1);
    }
    
    // If it starts with 7, add 254 prefix
    if (p.startsWith("7")) {
      return "254" + p;
    }
    
    // If it already starts with 254, return as is
    if (p.startsWith("254") && p.length === 12) {
      return p;
    }
    
    // Default fallback: assume it's 07 format missing the 0
    if (p.length === 9) {
      return "2547" + p;
    }
    
    return p;
  };

  /**
   * Format phone number for display (07XXXXXXXX)
   * @param {string} phone - Phone number in any format
   * @returns {string} Formatted phone number for display
   */
  const formatPhoneForDisplay = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    if (p.startsWith("254")) {
      return "0" + p.substring(3);
    }
    if (p.startsWith("0")) {
      return p;
    }
    if (p.startsWith("7")) {
      return "0" + p;
    }
    return p;
  };

  /**
   * Check transaction status with HashPay backend
   * @param {string} reference - Transaction reference
   * @returns {Promise<object>} Status response
   */
  const checkTransactionStatus = async (reference) => {
    try {
      const response = await fetch(`${HASHPAY_API_ENDPOINT}?action=status&reference=${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Status check failed:', response.status);
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

  /**
   * Poll for transaction status
   * @param {string} reference - Transaction reference
   * @param {number} amount - Payment amount
   * @param {string} phone - User phone number
   */
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
        if (statusData.success && (statusData.status === "COMPLETED" || statusData.status === "SUCCESS")) {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessing(false);
          
          // Store payment verification
          localStorage.setItem('crbPaymentVerified', 'true');
          localStorage.setItem('crbPaymentReference', reference);
          
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
        if (statusData.status === "FAILED" || statusData.status === "CANCELLED") {
          clearInterval(interval);
          setPollingInterval(null);
          setIsProcessing(false);
          
          Swal.fire({
            title: "Payment Failed",
            html: `❌ The payment was not completed. ${statusData.message || "Please try again."}`,
            icon: "error",
            confirmButtonText: "OK",
          });
          return;
        }
        
        // If still PENDING, continue polling
        console.log(`Payment status: ${statusData.status || 'PENDING'}, attempt ${attempts}/${maxAttempts}`);
        
      } catch (error) {
        console.log('Polling attempt', attempts, 'failed, continuing...');
        // Continue polling - don't show error to user
      }
    };

    // Check every 5 seconds
    interval = setInterval(checkStatus, 5000);
    setPollingInterval(interval);
    
    return interval;
  };

  /**
   * Initiate HashPay STK Push payment
   * @returns {Promise<object>} Initiation result
   */
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

    const hashPayPhone = formatPhoneForHashPay(userData.phone);
    
    // Validate phone number format for HashPay
    if (!hashPayPhone.match(/^254[0-9]{9}$/)) {
      Swal.fire({
        title: "Invalid Phone Number",
        text: "Please ensure your phone number is correct (e.g., 07XXXXXXXX or 2547XXXXXXXX)",
        icon: "error",
      });
      return false;
    }
    
    try {
      const response = await fetch(HASHPAY_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: userData.phone, // Send raw phone, backend will format
          amount: depositAmount,
          loanAmount: null, // Not applicable for service fee
          loanType: 'crb_service_fee',
          account_reference: `CRB-${Date.now()}`,
          transaction_desc: 'CRB Check Service Fee Payment'
        })
      });

      const data = await response.json();
      console.log('HashPay initiation response:', data);

      if (data.success) {
        return {
          success: true,
          reference: data.reference,
          checkout_id: data.checkout_id,
          message: data.message || "STK Push sent successfully"
        };
      } else {
        throw new Error(data.error || data.message || "Payment initiation failed");
      }
    } catch (error) {
      console.error('HashPay payment initiation error:', error);
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

    const displayPhone = formatPhoneForDisplay(userData.phone);
    const hashPayPhone = formatPhoneForHashPay(userData.phone);

    // Validate phone number
    if (!hashPayPhone.match(/^254[0-9]{9}$/)) {
      Swal.fire({
        title: "Invalid Phone Number Format",
        html: `
          <div style="text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b;"></i>
            <h3 style="margin: 15px 0;">Phone Number Issue</h3>
            <p>Your phone number (${userData.phone}) appears to be invalid.</p>
            <p>Please go back and update your phone number to a valid Kenyan number.</p>
            <p style="font-size: 0.85rem; color: #666; margin-top: 10px;">
              Format: 07XXXXXXXX or 2547XXXXXXXX
            </p>
          </div>
        `,
        icon: "warning",
        confirmButtonText: "Go Back",
      }).then(() => {
        navigate("/crb-check");
      });
      return;
    }

    // Confirmation modal
    const { value: confirmed } = await Swal.fire({
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

    if (!confirmed) return;

    // Show loading
    Swal.fire({
      title: "Initiating Payment",
      html: "Connecting to M-Pesa via HashPay...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    setIsProcessing(true);

    // Initiate payment
    const result = await initiatePayment();
    
    if (result && result.success) {
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
            <p style="margin-top: 10px;"><small>Phone: ${displayPhone}</small></p>
            <div style="background: #f8f9ff; padding: 12px; border-radius: 8px; margin-top: 15px; text-align: left;">
              <p style="font-size: 0.85rem; margin: 0;">
                <i class="fas fa-clock" style="color: #059669; margin-right: 8px;"></i>
                Waiting for payment confirmation...
              </p>
              <p style="font-size: 0.7rem; margin: 8px 0 0 0; color: #666;">
                Reference: ${result.reference}
              </p>
            </div>
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
            <p>${result?.error || "Please check your network connection and try again."}</p>
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
              Your payment is secured and encrypted via HashPay. We value your privacy.
            </span>
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

      {/* Add additional styles for the component */}
      <style>{`
        .amount-input label {
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--dark);
        }
        
        .deposit-card {
          animation: fadeInUp 0.5s ease-out;
          max-width: 500px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 30px;
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
          font-size: 1.3rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 25px;
          color: #333;
        }
        
        .mpesa-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
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
