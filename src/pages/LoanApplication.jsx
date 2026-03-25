import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function LoanApplication() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    phone_number: "",
  });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // PayHero API configuration
  const PAYHERO_API_BASE = 'https://backend.payhero.co.ke/api/v2';
  const AUTH_TOKEN = 'Basic bnhvR1cxSVZqMFVoVVNHMmtTc3A6czFmcFF0NFRJa0lreFowYXZVWjdkRDRkdHJKeUtRaUxldjdoVVZVTw==';//cmxZdTh4dGtTUG1EZVZTa1JXZDQ6UndETHdMcmd4Z3lVRmtKYXlzS09UNjNYS1Bvemh0T0xXZ09IOGgwOA==';

  // Your payment channel IDs from the console output
  const CHANNELS = {
    COOP_BANK: 3123,      // Co-operative Bank channel
    SASAPAY_WALLET: 4201   // SASAPAY WALLET channel
  };
  
  // Use the SASAPAY wallet for M-Pesa STK Push
  const CHANNEL_ID = CHANNELS.COOP_BANK;

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

    // Fetch and log your payment channels
    const fetchPaymentChannels = async () => {
      try {
        const response = await fetch(`${PAYHERO_API_BASE}/payment_channels?is_active=true`, {
          headers: {
            'Authorization': AUTH_TOKEN,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        console.log('Your Payment Channels:', data.payment_channels);
      } catch (error) {
        console.error('Error fetching channels:', error);
      }
    };
    
    fetchPaymentChannels();
  }, []);

  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    let p = phone.toString().replace(/\D/g, "");
    
    // If it starts with 0, keep it as is for PayHero (they expect 07... format)
    if (p.startsWith("0")) {
      return p; // Return as is: 07XXXXXXXX
    }
    
    // If it starts with 7, add 0
    if (p.startsWith("7")) {
      return "0" + p;
    }
    
    // If it's in 254 format, convert to 07 format
    if (p.startsWith("254")) {
      return "0" + p.substring(3);
    }
    
    return p;
  };

const checkTransactionStatus = async (reference) => {
  try {
    // Use the correct endpoint from PayHero docs: /api/v2/transaction-status
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

const pollTransactionStatus = (reference, loan, phone) => {
  let attempts = 0;
  const maxAttempts = 30; // 30 attempts * 5 seconds = 2.5 minutes max
  let pollInterval;

  const checkStatus = async () => {
    if (attempts >= maxAttempts) {
      clearInterval(pollInterval);
      Swal.fire({
        title: "Payment Timeout",
        html: "⏰ Payment monitoring timeout. Please check your transaction history.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    attempts++;

    try {
      // Use PayHero's transaction-status endpoint
      const statusData = await checkTransactionStatus(reference);
      
      // Check if payment was successful
      if (statusData.success && statusData.status === "SUCCESS") {
        clearInterval(pollInterval);
        showSuccessMessage(loan, phone, reference);
        return;
      }
      
      // If payment failed
      if (statusData.status === "FAILED") {
        clearInterval(pollInterval);
        Swal.fire({
          title: "Payment Failed",
          html: "❌ The payment was not completed. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
      
      // If still QUEUED or PENDING, continue polling
      console.log(`Payment status: ${statusData.status}, attempt ${attemptes}/${maxAttempts}`);
      
    } catch (error) {
      console.log('Polling attempt', attempts, 'failed, continuing...');
      // Continue polling - don't show error
    }
  };

  // Check every 5 seconds
  pollInterval = setInterval(checkStatus, 5000);
  
  // Return interval ID in case we need to clear it
  return pollInterval;
};

  const showSuccessMessage = (loan, phone, reference) => {
    Swal.fire({
      title: "Payment Successful! 🎉",
      html: `
        <div style="text-align: center;">
          <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
          <h3 style="margin: 15px 0; color: #10b981;">Payment Completed</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin: 15px 0; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Loan Amount:</span>
              <strong>Ksh ${loan.amount.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Processing Fee:</span>
              <strong>Ksh ${loan.fee}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Phone Number:</span>
              <strong>${phone}</strong>
            </div>
          </div>
          <p style="color: #6b7280; margin: 15px 0;">
            Your loan application is now being processed. You'll receive funds shortly.
          </p>
        </div>
      `,
      icon: "success",
      confirmButtonText: "Continue",
    }).then(() => {
      navigate("/");
    });
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

    // Confirm loan application modal
    const { value: confirmed } = await Swal.fire({
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
            <i class="fas fa-mobile-alt"></i> ${userData.phone_number}
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

    // Process Payment if Confirmed
    if (confirmed) {
      Swal.fire({
        title: "Initiating Payment",
        html: "Connecting to M-Pesa...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      setIsProcessing(true);

      try {
        const formattedPhone = formatPhoneNumber(userData.phone_number);
        const amount = selectedLoan.fee;
        const externalReference = `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        console.log('Initiating payment with:', {
          amount,
          phone: formattedPhone,
          channel_id: CHANNEL_ID,
          external_reference: externalReference
        });

        // Initiate STK Push using PayHero API
        const response = await fetch(`${PAYHERO_API_BASE}/payments`, {
          method: 'POST',
          headers: {
            'Authorization': AUTH_TOKEN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amount,
            phone_number: formattedPhone, // Send in format 07XXXXXXXX
            channel_id: 3123,
            provider: 'm-pesa',
            //external_reference: externalReference,
            //customer_name: userData.name || 'Customer'
          })
        });

        const data = await response.json();
        console.log('PayHero response:', data);

        if (data.success) {
          // Close the loading modal
          Swal.close();
          
          // Show authorization message
          Swal.fire({
            title: "Check Your Phone",
            html: `
              <div style="text-align: center;">
                <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
                <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
                <p>Check your phone to authorize payment of <strong>Ksh ${selectedLoan.fee}</strong></p>
                <p><small>Phone: ${formattedPhone}</small></p>
                <p style="color: #666; font-size: 0.9rem; margin-top: 15px;">
                  ✅ Payment request sent. Please check your phone and enter your M-Pesa PIN.
                </p>
                <p style="font-size: 0.8rem; color: #888; margin-top: 10px;">
                  Reference: ${data.reference || externalReference}
                </p>
              </div>
            `,
            icon: "info",
            confirmButtonText: "OK",
          }).then(() => {
            // Start polling your backend for status
            pollTransactionStatus(data.reference || externalReference, selectedLoan, formattedPhone);
          });
        } else {
          throw new Error(data.error_message || "Payment initialization failed");
        }
      } catch (error) {
        console.error('Payment error:', error);
        Swal.fire({
          title: "Payment Failed",
          html: `
            <p style="font-size: 0.9rem;">${error.message || "Unable to process payment. Please try again."}</p>
            <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">
              Ensure your phone number is correct and you have sufficient M-Pesa balance.
            </p>
          `,
          icon: "error",
          confirmButtonText: "Try Again",
        });
      } finally {
        setIsProcessing(false);
      }
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
    </div>
  );
}

export default LoanApplication;