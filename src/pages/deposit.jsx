import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ServicePayment() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    phone: ""
  });
  const [depositAmount] = useState(100); // Fixed amount for service fee
  const [isProcessing, setIsProcessing] = useState(false);

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
  }, []);


  const PayHeroConfig = {
    Authorization: 'your_PayHero_authorization_token',
    pesapalConsumerKey: 'your_pesapal_consumer_key',
    pesapalConsumerSecret: 'your_pesapal_consumer_secret',
    pesapalApiUrl: 'https://payments.pesapal.com/pesapalv3/api', // Sandbox or production URL
    pesapalCallbackUrl: 'https://your-application.com/pesapal-callback',
    pesapalIpnId: 'your_pesapal_ipn_id'
  };

  const PayHero = new PayHero(PayHeroConfig);

  const payWithPayHeroStk = () => {
    const paymentDetails = {
      amount: 10,
      phone_number: "0740161331",
      channel_id: 6415,
      provider: "m-pesa",
      external_reference: "INV-009",
      callback_url: "https://example.com/callback.php"
    };

    PayHero.makeStkPush(paymentDetails)
      .then(response => console.log(response))
      .catch(error => console.error(error));
    }

  const formatPhoneNumber = (phone) => {
    let p = phone.toString().replace(/\D/g, "");
    if (p.startsWith("0")) {
      return "254" + p.substring(1);
    }
    if (p.startsWith("7") || p.startsWith("1")) {
      return "254" + p;
    }
    if (p.startsWith("254")) {
      return p;
    }
    return p;
  };

  const generateRandomEmail = () => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const domains = ["gmail.com", "yahoo.com", "outlook.com"];

    let username = "";
    const usernameLength = Math.floor(Math.random() * 5) + 8;

    for (let i = 0; i < usernameLength; i++) {
      if (i < 6) {
        username += letters.charAt(Math.floor(Math.random() * letters.length));
      } else {
        if (Math.random() < 0.6) {
          username += letters.charAt(Math.floor(Math.random() * letters.length));
        } else {
          username += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
      }
    }

    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
  };

  const startPaymentPolling = (reference) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
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
        const response = await fetch(
          `https://crbloan-api-production.up.railway.app/api/status/${reference}`
        );
        const data = await response.json();

        if (data.success) {
          if (data.paid) {
            // Payment successful
            localStorage.setItem('crbPaymentVerified', 'true');
            
            Swal.fire({
              title: "Payment Successful! 🎉",
              html: `
                <div style="text-align: center;">
                  <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                  <h3 style="margin: 15px 0;">KSh ${depositAmount} Paid</h3>
                  <p>Service fee payment completed successfully</p>
                </div>
              `,
              icon: "success",
              confirmButtonText: "View Results",
            }).then(() => {
              navigate("/credit-check-status");
            });
            return;
          }

          if (data.can_retry) {
            Swal.fire({
              title: "Payment Not Completed",
              html: "⚠️ Payment not completed. You can try again.",
              icon: "warning",
              confirmButtonText: "OK",
            });
            return;
          }

          // Continue polling
          setTimeout(checkStatus, 6000);
        }
      } catch (error) {
        setTimeout(checkStatus, 6000);
      }
    };

    setTimeout(checkStatus, 6000);
  };

  const submitOTP = async (reference, otp) => {
    try {
      const response = await fetch(
        "https://crbloan-api-production.up.railway.app/api/submit-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            otp: otp.trim(),
            reference: reference,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        Swal.showValidationMessage(
          data.message || "Invalid OTP. Please try again."
        );
        return false;
      }
    } catch (error) {
      Swal.showValidationMessage("OTP verification failed. Please try again.");
      return false;
    }
  };

  const handlePayment = async () => {
    if (!userData.phone) {
      Swal.fire({
        title: "Phone Number Required",
        text: "Please complete the CRB check form first to provide your phone number",
        icon: "warning",
      });
      return;
    }

    // SIMPLE CONFIRMATION MODAL - Like the working Deposit component
    const { value: confirmed } = await Swal.fire({
      title: "Confirm Service Fee Payment",
      html: `
        <div style="text-align: center;">
          <p>Service Fee: <strong>KSh ${depositAmount.toLocaleString()}</strong></p>
          <p>Phone: <strong>${userData.phone}</strong></p>
          <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
            This payment is required to view your CRB status results
          </p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proceed to M-Pesa",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
    });

    if (!confirmed) return;

    Swal.fire({
      title: "Processing...",
      text: "Initiating M-Pesa payment",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    setIsProcessing(true);

    try {
      const formattedPhone = formatPhoneNumber(userData.phone);
      const email = generateRandomEmail();

      // Call the same Railway API
      const response = await fetch(
        "https://crbloan-api-production.up.railway.app/api/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            amount: depositAmount,
            phone: formattedPhone,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data.status === 'success') {
          // Immediate success
          localStorage.setItem('crbPaymentVerified', 'true');
          
          Swal.fire({
            title: "Payment Successful! 🎉",
            html: `
              <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                <h3 style="margin: 15px 0;">KSh ${depositAmount} Paid</h3>
                <p>Service fee payment completed successfully</p>
              </div>
            `,
            icon: "success",
            confirmButtonText: "View Results",
          }).then(() => {
            navigate("/credit-check-status");
          });
        } else if (data.requires_authorization) {
          // STK Push - Show authorization message
          Swal.fire({
            title: "Check Your Phone",
            html: `
              <div style="text-align: center;">
                <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
                <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
                <p>Check your phone to authorize payment of <strong>KSh ${depositAmount}</strong></p>
                <p><small>Phone: ${formattedPhone}</small></p>
              </div>
            `,
            icon: "info",
            confirmButtonText: "OK",
          }).then(() => {
            startPaymentPolling(data.reference);
          });
        } else if (data.requires_otp) {
          // OTP flow
          Swal.fire({
            title: "OTP Required",
            html: "📱 OTP sent! Please check your phone for the authorization code.",
            input: "text",
            inputPlaceholder: "Enter OTP",
            showCancelButton: true,
            confirmButtonText: "Submit OTP",
            cancelButtonText: "Cancel",
            showLoaderOnConfirm: true,
            preConfirm: async (otp) => {
              if (!otp) {
                Swal.showValidationMessage("Please enter the OTP");
                return false;
              }
              return await submitOTP(data.reference, otp);
            },
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              startPaymentPolling(data.reference);
            }
          });
        } else {
          // Generic success
          Swal.fire({
            title: "Payment Initiated",
            html: `📱 ${data.message || "Payment processing..."}`,
            icon: "info",
            confirmButtonText: "OK",
          }).then(() => {
            startPaymentPolling(data.reference);
          });
        }
      } else {
        throw new Error(data.message || "Payment initialization failed");
      }
    } catch (error) {
      Swal.fire({
        title: "Payment Failed",
        text: error.message || "Unable to process payment. Please try again.",
        icon: "error",
        confirmButtonText: "Try Again",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="deposit-card">
        <div className="deposit-title">Service Fee Payment</div>

        <div className="amount-input">
          <label>Payment Amount: KSh 100</label>
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
              <strong>Phone:</strong> {userData.phone}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '8px 0 0 0' }}>
              M-Pesa payment will be sent to this number
            </p>
          </div>
        )}

        <div className="mpesa-info">
          <h4>
            <i className="fas fa-info-circle"></i> M-Pesa Payment Process
          </h4>
          <ul>
            <li>Click "Pay with M-Pesa" below</li>
            <li>Check your phone for M-Pesa prompt</li>
            <li>Enter your M-Pesa PIN to authorize payment of KSh 100</li>
            <li>After successful payment, view your CRB status results</li>
          </ul>
        </div>

        <button
          className="deposit-btn"
          onClick={handlePayment}
          disabled={isProcessing || !userData.phone}
        >
          <i className="fas fa-mobile-alt"></i>
          {isProcessing ? "Processing..." : "Pay with M-Pesa"}
        </button>
        
        {!userData.phone && (
          <p style={{ 
            color: '#dc3545', 
            textAlign: 'center', 
            marginTop: '15px', 
            fontSize: '0.9rem',
            padding: '10px',
            background: '#f8d7da',
            borderRadius: '8px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
            Please complete the CRB check form first to provide your phone number
          </p>
        )}
      </div>
    </div>
  );
}

export default ServicePayment;