import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import './Loan.css';

function LoanApplicationHashback() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "", phone_number: "" });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoanSummary, setShowLoanSummary] = useState(false);
  const [loanApplicationData, setLoanApplicationData] = useState(null);
  const wsRef = useRef(null);
  const currentCheckoutIdRef = useRef(null);
  const currentReferenceRef = useRef(null);
  const statusCheckIntervalRef = useRef(null);
  const paymentCompletedRef = useRef(false);
  const timeoutRef = useRef(null);
  const summaryRef = useRef(null);

  // HashBack API Configuration
  const BACKEND_URL = 'https://hash-back-server-production.up.railway.app';
  
  // Direct HashPay API Configuration (for direct status checks)
  const HASHPAY_API_KEY = "h265272vstks7";
  const HASHPAY_ACCOUNT_ID = "HP785409";
  const HASHPAY_STATUS_URL = "https://api.hashback.co.ke/transactionstatus";

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
    const storedData = localStorage.getItem("crbCheckData");
    if (storedData) {
      const formData = JSON.parse(storedData);
      setUserData({
        name: formData.fullName || "Customer",
        phone_number: formData.phoneNumber || "",
      });
    }

    const sessionData = JSON.parse(sessionStorage.getItem("myLoan") || "{}");
    if (sessionData.phone_number) {
      setUserData((prev) => ({
        ...prev,
        name: sessionData.name || prev.name,
        phone_number: sessionData.phone_number || prev.phone_number,
      }));
    }
    
    setupWebSocket();
    
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (statusCheckIntervalRef.current) clearInterval(statusCheckIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const setupWebSocket = () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      
      wsRef.current = new WebSocket('wss://hash-back-server-production.up.railway.app');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for loan payment');
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
            console.log('🎉 Payment completed via WebSocket!');
            handlePaymentSuccess(message.data);
          } else if (message.type === 'registered') {
            console.log('✅ Registered for checkout:', message.checkoutId);
          }
        } catch (error) {
          console.error('WebSocket parse error:', error);
        }
      };
      
      wsRef.current.onerror = (error) => console.error('WebSocket error:', error);
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(setupWebSocket, 5000);
      };
    } catch (error) {
      console.log('WebSocket failed:', error);
    }
  };

  // Direct HashPay status check
  const checkHashPayStatusDirectly = async (checkoutId) => {
    try {
      console.log('🔍 Direct HashPay status check for loan:', checkoutId);
      
      const response = await fetch(HASHPAY_STATUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: HASHPAY_API_KEY,
          account_id: HASHPAY_ACCOUNT_ID,
          checkoutid: checkoutId,
        }),
      });

      const data = await response.json();
      console.log('Direct HashPay response:', data);

      if (data.ResultCode === "0" || data.ResultCode === 0) {
        return {
          status: 'completed',
          transactionId: data.TransactionID,
          amount: data.TransactionAmount,
        };
      } else if (data.ResultCode === "2" || data.ResultCode === 2) {
        return { status: 'failed', errorDesc: data.ResultDesc };
      }
      return { status: 'pending' };
    } catch (error) {
      console.error('Direct HashPay error:', error);
      return { status: 'unknown' };
    }
  };

  const formatPhoneForHashPay = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    if (p.startsWith("0")) return p;
    if (p.startsWith("7") || p.startsWith("1")) return "0" + p;
    if (p.startsWith("254")) return "0" + p.substring(3);
    return p;
  };

  const formatPhoneForDisplay = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    if (p.startsWith("254")) return "0" + p.substring(3);
    if (p.startsWith("0")) return p;
    if (p.startsWith("7")) return "0" + p;
    return p;
  };

  const isValidPhoneNumber = (phone) => {
    const digits = phone.toString().replace(/\D/g, "");
    return digits.startsWith("07") && digits.length === 10;
  };

  const handleLoanSelection = (loan) => {
    setSelectedLoan(loan);
    const errorMessage = document.getElementById("error-message");
    if (errorMessage) errorMessage.style.display = "none";

    const updatedData = {
      ...userData,
      loan_amount: loan.amount,
      processing_fee: loan.fee,
    };
    sessionStorage.setItem("myLoan", JSON.stringify(updatedData));
  };

  const showLoanProcessingMessage = (loan, phone, reference, transactionId) => {
    const applicationDate = new Date();
    const formattedDate = applicationDate.toLocaleDateString('en-GB');
    const formattedTime = applicationDate.toLocaleTimeString('en-GB');
    
    setLoanApplicationData({
      name: userData.name,
      phone: phone,
      loanAmount: loan.amount,
      processingFee: loan.fee,
      totalRepayment: loan.amount * 1.1,
      reference: reference,
      transactionId: transactionId,
      applicationDate: formattedDate,
      applicationTime: formattedTime,
      status: 'Processing',
      estimatedDisbursement: 'Within 24 hours'
    });
    
    setShowLoanSummary(true);
    
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    Swal.fire({
      title: "Payment Successful! 🎉",
      html: `
        <div style="text-align: center;">
          <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
          <h3 style="margin: 15px 0; color: #10b981;">Payment Completed</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin: 15px 0; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666;">Loan Amount:</span>
              <strong style="color: #10b981;">Ksh ${loan.amount.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666;">Processing Fee:</span>
              <strong style="color: #10b981;">Ksh ${loan.fee}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666;">Phone Number:</span>
              <strong style="color: #10b981;">${phone}</strong>
            </div>
          </div>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <i class="fas fa-spinner fa-spin" style="color: #059669; font-size: 24px; margin-bottom: 10px;"></i>
            <p style="color: #059669; font-weight: 500; margin: 10px 0 0 0;">
              Your loan application is now being processed!
            </p>
            <p style="color: #666; font-size: 0.85rem; margin: 8px 0 0 0;">
              You will receive funds within 24 hours. Please keep checking your M-Pesa account.
            </p>
          </div>
          <div style="background: #f8f9ff; padding: 10px; border-radius: 8px; margin-top: 10px;">
            <p style="font-size: 0.75rem; margin: 0; color: #666;">Transaction ID: ${transactionId || 'N/A'}</p>
            <p style="font-size: 0.75rem; margin: 5px 0 0 0; color: #666;">Reference: ${reference}</p>
          </div>
        </div>
      `,
      icon: "success",
      confirmButtonText: "View Loan Summary",
      confirmButtonColor: "#059669",
      allowOutsideClick: false
    }).then(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handlePaymentSuccess = (data) => {
    if (paymentCompletedRef.current) {
      console.log('Payment already processed, skipping duplicate');
      return;
    }
    
    console.log('Processing payment success:', data);
    paymentCompletedRef.current = true;
    
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    Swal.close();
    setIsProcessing(false);
    
    localStorage.setItem('loanPaymentVerified', 'true');
    localStorage.setItem('loanTransactionId', data.transactionId || data.TransactionID);
    localStorage.setItem('loanAmount', selectedLoan?.amount || data.amount);
    localStorage.setItem('processingFee', selectedLoan?.fee || 0);
    localStorage.setItem('loanReference', currentReferenceRef.current || data.reference || 'N/A');
    localStorage.setItem('loanApplicationData', JSON.stringify({
      name: userData.name,
      phone: formatPhoneForDisplay(userData.phone_number),
      loanAmount: selectedLoan?.amount,
      processingFee: selectedLoan?.fee,
      reference: currentReferenceRef.current || data.reference,
      transactionId: data.transactionId || data.TransactionID
    }));
    
    const displayPhone = formatPhoneForDisplay(userData.phone_number);
    const reference = currentReferenceRef.current || data.reference || 'N/A';
    const transactionId = data.transactionId || data.TransactionID;
    
    showLoanProcessingMessage(selectedLoan, displayPhone, reference, transactionId);
  };

  const checkPaymentStatus = async (checkoutId, showLoading = false) => {
    try {
      if (showLoading) {
        Swal.fire({
          title: "Checking Payment Status",
          text: "Please wait...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
      }
      
      console.log('Checking loan payment status for:', checkoutId);
      
      let data = null;
      try {
        const response = await fetch(`${BACKEND_URL}/api/check-payment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutId })
        });
        data = await response.json();
        console.log('Backend status:', data);
      } catch (err) {
        console.log('Backend check failed');
      }
      
      if (!data || data.status !== 'completed') {
        const directResult = await checkHashPayStatusDirectly(checkoutId);
        if (directResult.status === 'completed') {
          data = directResult;
        }
      }
      
      if (showLoading) Swal.close();
      
      if (data?.status === 'completed') {
        handlePaymentSuccess(data);
        return true;
      } else if (data?.status === 'failed') {
        Swal.fire({ title: "Payment Failed", text: "Please try again.", icon: "error" });
        setIsProcessing(false);
        paymentCompletedRef.current = false;
        return false;
      }
      return false;
    } catch (error) {
      console.error('Status check error:', error);
      if (showLoading) Swal.close();
      return false;
    }
  };

  const handleApply = async () => {
    if (!selectedLoan) {
      const errorMessage = document.getElementById("error-message");
      if (errorMessage) errorMessage.style.display = "block";
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

    if (!isValidPhoneNumber(userData.phone_number)) {
      Swal.fire({ 
        title: "Invalid Phone Number", 
        text: "Must be a valid Kenyan number (e.g., 0712345678)", 
        icon: "error" 
      });
      return;
    }

    if (isProcessing) return;
    paymentCompletedRef.current = false;

    const displayPhone = formatPhoneForDisplay(userData.phone_number);
    const hashPayPhone = formatPhoneForHashPay(userData.phone_number);

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
              <span style="color: #666; font-weight: 500;">Loan Amount:</span>
              <span style="color: #10b981; font-weight: 700;">Ksh ${selectedLoan.amount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(0, 102, 0, 0.1);">
              <span style="color: #666; font-weight: 500;">Processing Fee:</span>
              <span style="color: #10b981; font-weight: 700;">Ksh ${selectedLoan.fee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666; font-weight: 500;">Total Repayment:</span>
              <span style="color: #10b981; font-weight: 700;">Ksh ${(selectedLoan.amount * 1.1).toLocaleString()}</span>
            </div>
          </div>
          
          <div style="background: rgba(0, 102, 0, 0.08); padding: 12px; border-radius: 8px; margin: 14px 0;">
            <i class="fas fa-mobile-alt"></i> ${displayPhone}
          </div>
          
          <p style="font-size: 0.85rem; color: #666; margin-top: 15px;">
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
      
      const response = await fetch(`${BACKEND_URL}/api/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedLoan.fee,
          phone: hashPayPhone,
          reference: reference,
          userId: localStorage.getItem('userId') || 'anonymous',
          metadata: {
            loanAmount: selectedLoan.amount,
            loanType: 'standard',
            purpose: 'loan_processing_fee'
          }
        })
      });

      const data = await response.json();
      console.log('Initiation response:', data);
      
      if (data.success === true && data.checkoutId) {
        currentCheckoutIdRef.current = data.checkoutId;
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'register',
            checkoutId: currentCheckoutIdRef.current
          }));
          console.log('Registered with WebSocket for checkout:', currentCheckoutIdRef.current);
        }
        
        Swal.close();
        
        // Show waiting for payment modal with manual check option
        Swal.fire({
          title: "Check Your Phone",
          html: `
            <div style="text-align: center;">
              <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
              <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
              <p>Check your phone to authorize payment of <strong>Ksh ${selectedLoan.fee}</strong></p>
              <p style="margin-top: 10px;"><small>Phone: ${displayPhone}</small></p>
              <div style="background: #f8f9ff; padding: 12px; border-radius: 8px; margin-top: 15px;">
                <p style="font-size: 0.8rem; margin: 0; color: #666;">
                  Reference: ${reference}
                </p>
                <p style="font-size: 0.7rem; margin: 5px 0 0 0; color: #888;">
                  Checkout ID: ${data.checkoutId}
                </p>
              </div>
              <div style="margin-top: 20px;">
                <div class="spinner-border" style="width: 40px; height: 40px; margin: 0 auto;"></div>
              </div>
              <p style="font-size: 0.85rem; color: #059669; margin-top: 15px;">
                <i class="fas fa-clock"></i> Waiting for payment confirmation...
              </p>
              <p style="font-size: 0.75rem; color: #888; margin-top: 10px;">
                Once you complete the payment, this will automatically update.
              </p>
              <button id="manualCheckBtn" class="swal2-confirm swal2-styled" style="margin-top: 15px; background-color: #059669;">
                <i class="fas fa-sync-alt"></i> Check Payment Status Now
              </button>
            </div>
          `,
          icon: "info",
          showConfirmButton: false,
          showCancelButton: true,
          cancelButtonText: "Cancel",
          didOpen: () => {
            const checkBtn = document.getElementById('manualCheckBtn');
            if (checkBtn) {
              checkBtn.onclick = async () => {
                checkBtn.disabled = true;
                checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                const completed = await checkPaymentStatus(currentCheckoutIdRef.current, true);
                if (completed) {
                  Swal.close();
                } else {
                  checkBtn.disabled = false;
                  checkBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Check Payment Status Now';
                  Swal.fire({
                    title: "Still Waiting",
                    text: "Payment not confirmed yet. Please complete the M-Pesa transaction on your phone.",
                    icon: "info",
                    confirmButtonText: "OK"
                  });
                }
              };
            }
            
            // Poll every 5 seconds
            statusCheckIntervalRef.current = setInterval(async () => {
              if (currentCheckoutIdRef.current && !paymentCompletedRef.current) {
                const completed = await checkPaymentStatus(currentCheckoutIdRef.current);
                if (completed) Swal.close();
              }
            }, 5000);
            
            // 3 minute timeout
            timeoutRef.current = setTimeout(() => {
              if (!paymentCompletedRef.current) {
                console.log('Payment timeout reached after 3 minutes');
                if (statusCheckIntervalRef.current) {
                  clearInterval(statusCheckIntervalRef.current);
                  statusCheckIntervalRef.current = null;
                }
                
                Swal.fire({
                  title: "Payment Not Confirmed",
                  html: `
                    <div style="text-align: center;">
                      <i class="fas fa-question-circle" style="font-size: 48px; color: #f59e0b;"></i>
                      <h3 style="margin: 15px 0;">Check Your Payment Status</h3>
                      <p>We haven't received confirmation yet.</p>
                      <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 15px; text-align: left;">
                        <p style="font-size: 0.85rem; margin: 0 0 8px 0; color: #92400e;">
                          <i class="fas fa-check-circle"></i> <strong>If you completed the payment:</strong>
                        </p>
                        <p style="font-size: 0.85rem; margin: 0 0 5px 15px; color: #92400e;">
                          • Click "Verify Payment" below to confirm
                        </p>
                        <p style="font-size: 0.85rem; margin: 0 0 5px 15px; color: #92400e;">
                          • Save this reference: <strong>${reference}</strong>
                        </p>
                        <p style="font-size: 0.85rem; margin: 0 15px; color: #92400e;">
                          • Check your M-Pesa messages for confirmation
                        </p>
                      </div>
                      <button id="verifyFinalBtn" class="swal2-confirm swal2-styled" style="margin-top: 20px; background-color: #059669;">
                        <i class="fas fa-check-circle"></i> Verify Payment
                      </button>
                    </div>
                  `,
                  icon: "warning",
                  showConfirmButton: false,
                  showCancelButton: true,
                  cancelButtonText: "Close",
                  didOpen: () => {
                    const verifyBtn = document.getElementById('verifyFinalBtn');
                    if (verifyBtn) {
                      verifyBtn.onclick = async () => {
                        verifyBtn.disabled = true;
                        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
                        const completed = await checkPaymentStatus(currentCheckoutIdRef.current, true);
                        if (!completed) {
                          Swal.fire({
                            title: "Not Verified Yet",
                            html: `
                              <div style="text-align: center;">
                                <p>Your payment couldn't be verified automatically.</p>
                                <p style="margin-top: 10px;">Please save this information and contact support:</p>
                                <div style="background: #f8f9ff; padding: 10px; border-radius: 8px; margin-top: 10px;">
                                  <strong>Reference: ${reference}</strong><br/>
                                  <strong>Checkout ID: ${currentCheckoutIdRef.current}</strong>
                                </div>
                                <p style="margin-top: 15px; font-size: 0.85rem; color: #666;">
                                  Your loan application may still be processed. Please check back in a few minutes.
                                </p>
                              </div>
                            `,
                            icon: "info",
                            confirmButtonText: "OK"
                          });
                          setIsProcessing(false);
                          paymentCompletedRef.current = false;
                        }
                      };
                    }
                  }
                });
                setIsProcessing(false);
              }
            }, 180000);
          }
        });
      } else {
        throw new Error(data.error || data.message || "Initiation failed");
      }
    } catch (error) {
      console.error('Payment error:', error);
      Swal.fire({ 
        title: "Payment Failed", 
        html: `
          <div style="text-align: center;">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626;"></i>
            <h3 style="margin: 15px 0;">Payment Failed</h3>
            <p>${error.message || "Unable to initiate payment. Please try again."}</p>
            <div style="background: #fef2f2; padding: 12px; border-radius: 8px; margin-top: 15px;">
              <p style="font-size: 0.85rem; margin: 0; color: #991b1b;">
                <i class="fas fa-info-circle"></i> Ensure your phone number is correct and you have sufficient M-Pesa balance.
              </p>
            </div>
          </div>
        `,
        icon: "error",
        confirmButtonText: "Try Again",
        confirmButtonColor: "#059669"
      });
      setIsProcessing(false);
      paymentCompletedRef.current = false;
    }
  };

  return (
    <div className="loan-application-container">
      {!showLoanSummary && !loanApplicationData && (
      <>
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
        style={{
          opacity: (isProcessing || !selectedLoan) ? 0.6 : 1,
          cursor: (isProcessing || !selectedLoan) ? 'not-allowed' : 'pointer'
        }}
      >
        {isProcessing ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <>Get Loan Now <i className="fas fa-arrow-right"></i></>}
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
      </>)}
      
      {/* Loan Summary Component */}
      {showLoanSummary && loanApplicationData && (
        <div className="loan-summary-section" ref={summaryRef}>
          <div className="loan-summary-card">
            <div className="summary-header">
              <h3><i className="fas fa-file-invoice"></i> Loan Application Summary</h3>
              <div className="summary-status processing">
                <i className="fas fa-spinner fa-spin"></i> {loanApplicationData.status}
              </div>
            </div>
            
            <div className="summary-content">
              <div className="personal-info-section">
                <h4><i className="fas fa-user"></i> Applicant Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{loanApplicationData.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone Number</span>
                    <span className="info-value">{loanApplicationData.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Application Date</span>
                    <span className="info-value">{loanApplicationData.applicationDate}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Application Time</span>
                    <span className="info-value">{loanApplicationData.applicationTime}</span>
                  </div>
                </div>
              </div>
              
              <div className="loan-details-section">
                <h4><i className="fas fa-hand-holding-usd"></i> Loan Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div>
                      <div className="detail-label">Loan Amount</div>
                      <div className="detail-value">Ksh {loanApplicationData.loanAmount.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="fas fa-percent"></i>
                    </div>
                    <div>
                      <div className="detail-label">Processing Fee</div>
                      <div className="detail-value">Ksh {loanApplicationData.processingFee}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div>
                      <div className="detail-label">Interest (10%)</div>
                      <div className="detail-value">Ksh {(loanApplicationData.loanAmount * 0.1).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <i className="fas fa-coins"></i>
                    </div>
                    <div>
                      <div className="detail-label">Total Repayment</div>
                      <div className="detail-value">Ksh {loanApplicationData.totalRepayment.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="disbursement-info">
                <h4><i className="fas fa-clock"></i> Disbursement Information</h4>
                <div className="disbursement-details">
                  <div className="disbursement-item">
                    <i className="fas fa-hourglass-half"></i>
                    <div>
                      <div className="disbursement-label">Estimated Time</div>
                      <div className="disbursement-value">{loanApplicationData.estimatedDisbursement}</div>
                    </div>
                  </div>
                  <div className="disbursement-item">
                    <i className="fas fa-mobile-alt"></i>
                    <div>
                      <div className="disbursement-label">Recipient M-Pesa</div>
                      <div className="disbursement-value">{loanApplicationData.phone}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="reference-info">
                <div className="reference-item">
                  <span className="reference-label">Application Reference:</span>
                  <span className="reference-value">{loanApplicationData.reference}</span>
                </div>
                {loanApplicationData.transactionId && (
                  <div className="reference-item" style={{ marginTop: '8px' }}>
                    <span className="reference-label">Transaction ID:</span>
                    <span className="reference-value">{loanApplicationData.transactionId}</span>
                  </div>
                )}
              </div>
              
              <div className="summary-footer">
                <button className="btn-print" onClick={() => window.print()}>
                  <i className="fas fa-print"></i> Print Summary
                </button>
                <button className="btn-home" onClick={() => navigate("/")}>
                  <i className="fas fa-home"></i> Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        
        .btn-apply:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Loan Summary Styles */
        .loan-summary-section {
          margin-top: 40px;
          animation: fadeInUp 0.5s ease-out;
        }
        
        .loan-summary-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
        }
        
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e8f5e9;
        }
        
        .summary-header h3 {
          color: #006600;
          font-size: 1.3rem;
          margin: 0;
        }
        
        .summary-status {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .summary-status.processing {
          background: #fff3e0;
          color: #f39c12;
        }
        
        .personal-info-section h4,
        .loan-details-section h4,
        .disbursement-info h4 {
          color: #333;
          font-size: 1rem;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e8f5e9;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .info-label {
          color: #666;
          font-size: 0.85rem;
        }
        
        .info-value {
          font-weight: 600;
          color: #333;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .detail-icon {
          width: 40px;
          height: 40px;
          background: #e8f5e9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
          font-size: 1.2rem;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 4px;
        }
        
        .detail-value {
          font-weight: 700;
          color: #059669;
          font-size: 1rem;
        }
        
        .disbursement-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .disbursement-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .disbursement-item i {
          font-size: 24px;
          color: #059669;
        }
        
        .disbursement-label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 4px;
        }
        
        .disbursement-value {
          font-weight: 600;
          color: #333;
        }
        
        .reference-info {
          background: #f8f9ff;
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          text-align: center;
        }
        
        .reference-item {
          margin: 5px 0;
        }
        
        .reference-label {
          color: #666;
          font-size: 0.8rem;
        }
        
        .reference-value {
          font-weight: 600;
          color: #059669;
          margin-left: 10px;
        }
        
        .summary-footer {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 25px;
        }
        
        .btn-print, .btn-home {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-print {
          background: #6c757d;
          color: white;
        }
        
        .btn-print:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }
        
        .btn-home {
          background: #059669;
          color: white;
        }
        
        .btn-home:hover {
          background: #047857;
          transform: translateY(-2px);
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
      `}</style>
    </div>
  );
}

export default LoanApplicationHashback;