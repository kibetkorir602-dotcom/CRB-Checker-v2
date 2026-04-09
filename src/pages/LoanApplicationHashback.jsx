import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import './Loan.css';

function LoanApplicationHashback() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "", phone_number: "" });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef(null);
  const currentCheckoutIdRef = useRef(null);
  const currentReferenceRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);
  const paymentCompletedRef = useRef(false);

  // Your published backend URL
  const BACKEND_URL = 'https://hash-back-server-production-2010.up.railway.app';

  // Loan options data
  const loanOptions = [
    { amount: 5500, fee: 100 },
    { amount: 6800, fee: 130 },
    { amount: 7800, fee: 170 },
    { amount: 9800, fee: 190 },
    { amount: 11200, fee: 230 },
    { amount: 16800, fee: 250 },
    { amount: 21200, fee: 270 },
    { amount: 25600, fee: 400 },
    { amount: 30000, fee: 470 },
    { amount: 35400, fee: 590 },
    { amount: 39800, fee: 730 },
    { amount: 44200, fee: 1010 },
    { amount: 48600, fee: 1600 },
    { amount: 60600, fee: 2050 },
  ];

  useEffect(() => {
    // Load user data from localStorage or sessionStorage
    const storedData = localStorage.getItem("crbCheckData");
    if (storedData) {
      const formData = JSON.parse(storedData);
      setUserData({
        name: formData.fullName || "Customer",
        phone_number: formData.phoneNumber || "",
      });
    }

    // Check for session storage data
    const sessionData = JSON.parse(sessionStorage.getItem("myLoan") || "{}");
    if (sessionData.phone_number) {
      setUserData((prev) => ({
        ...prev,
        name: sessionData.name || prev.name,
        phone_number: sessionData.phone_number || prev.phone_number,
      }));
    }
    
    // Setup WebSocket connection
    setupWebSocket();
    
    // Cleanup on unmount
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
    try {
      // Close existing connection if any
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      
      wsRef.current = new WebSocket('wss://hash-back-server-production-2010.up.railway.app');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        // Re-register if we have a checkout ID
        if (currentCheckoutIdRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'register',
            checkoutId: currentCheckoutIdRef.current
          }));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message:', message);
          
          if (message.type === 'payment_completed') {
            console.log('🎉 Payment completed message received!', message.data);
            handlePaymentSuccess(message.data);
          } else if (message.type === 'registered') {
            console.log('✅ Registered for checkout:', message.checkoutId);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
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

  const handleLoanSelection = (loan) => {
    setSelectedLoan(loan);
    // Hide error message when loan is selected
    const errorMessage = document.getElementById("error-message");
    if (errorMessage) {
      errorMessage.style.display = "none";
    }

    // Update session storage
    const updatedData = {
      ...userData,
      loan_amount: loan.amount,
      processing_fee: loan.fee,
    };
    sessionStorage.setItem("myLoan", JSON.stringify(updatedData));
  };

  const handlePaymentSuccess = (data) => {
    // Prevent duplicate success messages
    if (paymentCompletedRef.current) {
      console.log('Payment already processed, skipping duplicate');
      return;
    }
    
    console.log('Processing payment success:', data);
    paymentCompletedRef.current = true;
    
    // Clear any pending intervals
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
    
    // Close any open Swal modals
    Swal.close();
    
    setIsProcessing(false);
    
    // Store payment verification
    localStorage.setItem('loanPaymentVerified', 'true');
    localStorage.setItem('loanTransactionId', data.transactionId || data.TransactionID);
    localStorage.setItem('loanAmount', selectedLoan?.amount || data.amount);
    localStorage.setItem('processingFee', selectedLoan?.fee || 0);
    
    // Show success message
    Swal.fire({
      title: "Payment Successful! 🎉",
      html: `
        <div style="text-align: center;">
          <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
          <h3 style="margin: 15px 0;">KSh ${data.amount || selectedLoan?.fee} Paid</h3>
          <p>Processing fee payment completed successfully</p>
          <div style="background: #f8f9ff; padding: 12px; border-radius: 8px; margin: 15px 0; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Loan Amount:</span>
              <strong>Ksh ${selectedLoan?.amount?.toLocaleString() || 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Processing Fee Paid:</span>
              <strong>Ksh ${selectedLoan?.fee || data.amount || 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Transaction ID:</span>
              <strong style="font-size: 0.8rem;">${data.transactionId || data.TransactionID || 'N/A'}</strong>
            </div>
          </div>
          <p style="color: #6b7280; margin: 15px 0;">
            Your loan application is now being processed. You'll receive funds shortly.
          </p>
        </div>
      `,
      icon: "success",
      confirmButtonText: "Continue",
      confirmButtonColor: "#059669",
      allowOutsideClick: false
    }).then(() => {
      navigate("/");
    });
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
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
        handlePaymentSuccess(data);
      } else if (data.status === 'failed') {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
        Swal.close();
        Swal.fire({
          title: "Payment Failed",
          text: "The payment was not successful. Please try again.",
          icon: "error"
        });
        setIsProcessing(false);
        paymentCompletedRef.current = false;
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const handleApply = async () => {
    if (!selectedLoan) {
      const errorMessage = document.getElementById("error-message");
      if (errorMessage) {
        errorMessage.style.display = "block";
      }
      return;
    }

    if (!userData.phone_number) {
      Swal.fire({
        title: "Phone Number Required",
        text: "Please complete the CRB check first to provide your phone number",
        icon: "warning",
      });
      return;
    }

    // Reset payment completed flag
    paymentCompletedRef.current = false;

    const displayPhone = formatPhoneForDisplay(userData.phone_number);
    const hashPayPhone = formatPhoneForHashPay(userData.phone_number);
    
    console.log('Phone formatting:', {
      original: userData.phone_number,
      display: displayPhone,
      hashpay: hashPayPhone
    });
    
    if (!hashPayPhone.match(/^07[0-9]{8}$/)) {
      Swal.fire({ 
        title: "Invalid Phone Number", 
        text: `Phone number "${displayPhone}" is invalid. Must be a valid Kenyan number (e.g., 0712345678).`, 
        icon: "error" 
      });
      return;
    }

    // Confirm loan application modal
    const confirmed = await Swal.fire({
      title: "Confirm Loan Application",
      html: `
        <div style="text-align: center;">
          <div style="background: linear-gradient(135deg, #006600 0%, #004d00 100%); padding: 18px; border-radius: 16px 16px 0 0; color: white; margin: -20px -20px 20px -20px;">
            <div style="font-size: 36px; margin-bottom: 8px;"><i class="fas fa-check-circle"></i></div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Confirm Loan</div>
            <div style="font-size: 0.8rem; opacity: 0.9;">Review details before payment</div>
          </div>
          
          <div style="background: #f8f9ff; border-radius: 10px; padding: 14px; margin-bottom: 16px; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(0, 102, 0, 0.1);">
              <span style="color: #666; font-weight: 500; font-size: 0.85rem;">Loan Amount:</span>
              <span style="color: #10b981; font-weight: 700; font-size: 0.9rem;">Ksh ${selectedLoan.amount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(0, 102, 0, 0.1);">
              <span style="color: #666; font-weight: 500; font-size: 0.85rem;">Processing Fee:</span>
              <span style="color: #10b981; font-weight: 700; font-size: 0.9rem;">Ksh ${selectedLoan.fee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666; font-weight: 500; font-size: 0.85rem;">Total Repayment:</span>
              <span style="color: #10b981; font-weight: 700; font-size: 0.9rem;">Ksh ${(selectedLoan.amount * 1.1).toLocaleString()}</span>
            </div>
          </div>
          
          <div style="background: rgba(0, 102, 0, 0.08); padding: 12px; border-radius: 8px; margin: 14px 0; font-weight: 600; color: #10b981; border: 1px solid rgba(0, 102, 0, 0.15); font-size: 0.85rem;">
            <i class="fas fa-mobile-alt"></i> ${displayPhone}
          </div>
          
          <p style="font-size: 0.9rem; color: #666; margin-top: 15px;">
            Click "Proceed to M-Pesa" to pay the processing fee and complete your loan application.
          </p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proceed to M-Pesa",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#006600",
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
      const reference = `LOAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      currentReferenceRef.current = reference;
      
      console.log('Initiating payment via backend:', `${BACKEND_URL}/api/initiate-payment`);
      
      const response = await fetch(`${BACKEND_URL}/api/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedLoan.fee,
          phone: hashPayPhone,
          reference: reference,
          userId: localStorage.getItem('userId') || 'anonymous',
          loanAmount: selectedLoan.amount,
          loanType: 'standard'
        })
      });

      const data = await response.json();
      console.log('Initiation response from backend:', data);
      
      if (data.success === true && data.checkoutId) {
        // Store checkoutId
        currentCheckoutIdRef.current = data.checkoutId;
        
        // Register with WebSocket if available
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'register',
            checkoutId: currentCheckoutIdRef.current
          }));
          console.log('Registered with WebSocket for checkout:', currentCheckoutIdRef.current);
        } else {
          console.log('WebSocket not ready, will register on connection');
        }
        
        Swal.close();
        
        // Show waiting for payment modal
        Swal.fire({
          title: "Check Your Phone",
          html: `
            <div style="text-align: center;">
              <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
              <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
              <p>Check your phone to authorize payment of <strong>KSh ${selectedLoan.fee}</strong></p>
              <p style="margin-top: 10px;"><small>Phone: ${displayPhone}</small></p>
              <div style="background: #f8f9ff; padding: 12px; border-radius: 8px; margin-top: 15px;">
                <p style="font-size: 0.8rem; margin: 0; color: #666;">
                  Reference: ${reference}
                </p>
              </div>
              <div class="spinner-border text-success" role="status" style="margin-top: 20px; width: 40px; height: 40px;">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p style="font-size: 0.85rem; color: #059669; margin-top: 10px;">
                <i class="fas fa-clock"></i> Waiting for payment confirmation...
              </p>
            </div>
          `,
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
          didOpen: () => {
            // Start polling as backup (5 seconds)
            statusCheckIntervalRef.current = setInterval(() => {
              if (currentCheckoutIdRef.current && !paymentCompletedRef.current) {
                checkPaymentStatus(currentCheckoutIdRef.current);
              }
            }, 5000);
            
            // Set timeout for payment confirmation (2 minutes)
            setTimeout(() => {
              if (!paymentCompletedRef.current) {
                if (statusCheckIntervalRef.current) {
                  clearInterval(statusCheckIntervalRef.current);
                  statusCheckIntervalRef.current = null;
                }
                Swal.close();
                Swal.fire({
                  title: "Payment Not Confirmed",
                  text: "Payment confirmation timed out. Please check your M-Pesa statement or contact support.",
                  icon: "warning",
                  confirmButtonColor: "#059669"
                });
                setIsProcessing(false);
                paymentCompletedRef.current = false;
              }
            }, 120000);
          }
        });
      } else {
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
      paymentCompletedRef.current = false;
    }
  };

  return (
    <div className="loan-application-container">
      <div className="welcome-card">
        <p className="welcome-text">
          Hi <span className="user-name">{userData.name || "Customer"}</span>,
          you qualify for these loan options based on your{" "}
          <strong>credit records</strong>.
        </p>
      </div>

      <div className="loan-card">
        <h3 className="card-title">Select Your Loan Amount</h3>

        <div className="loan-grid">
          {loanOptions.map((loan, index) => (
            <div
              key={index}
              className={`loan-option ${selectedLoan?.amount === loan.amount ? "selected" : ""}`}
              onClick={() => handleLoanSelection(loan)}
            >
              <div className="loan-amount">
                Ksh {loan.amount.toLocaleString()}
              </div>
              <div className="processing-fee">Fee: Ksh {loan.fee}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        id="apply-btn"
        className="btn-apply"
        onClick={handleApply}
        disabled={isProcessing || !selectedLoan}
      >
        {isProcessing ? "Processing..." : "Get Loan Now"}{" "}
        <i className="fas fa-arrow-right"></i>
      </button>

      <div
        id="error-message"
        className="error-message"
        style={{ display: "none" }}
      >
        Please select a loan amount to continue
      </div>

      <a href="/" className="back-link">
        <i className="fas fa-arrow-left"></i> Back to Home
      </a>

      <style>{`
        .spinner-border {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid #059669;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border 0.75s linear infinite;
        }
        
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
        
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}

export default LoanApplicationHashback;