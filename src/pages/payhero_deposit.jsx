import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import PayHero from "payhero-wrapper";

// Payment configuration
const PayHeroConfig = {
  Authorization: 'Basic cEN1RVV4T2h0UW9JaHFEYzJEaTA6RUhqZUVLRmI0T29KRkdpeFZYV05waENPYXZybTZwOEsxZnQwUlZPSg==',
  pesapalConsumerKey: 'i+5HTEXjBox0yM7JL1TTfOlMQWRW0CCJ',
  pesapalConsumerSecret: '8qecPKt5i0XVZSzPVgwaRkOgrBc=',
  pesapalApiUrl: 'https://payments.pesapal.com/pesapalv3/api',
  pesapalCallbackUrl: 'https://www.powerkingtips.com/pay',
  pesapalIpnId: 'your_pesapal_ipn_id'
};

const AppPayHero = new PayHero(PayHeroConfig);

function ServicePayment() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    phone: ""
  });
  const [depositAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

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
      return p;
    }
    if (p.startsWith("7") || p.startsWith("1")) {
      return "0" + p;
    }
    if (p.startsWith("254")) {
      return "0" + p.substring(3);
    }
    if (p.startsWith("2541")) {
      return "0" + p.substring(3);
    }
    return p;
  };

  // Function to check payment status
  const checkPaymentStatus = async (reference) => {
    try {
      // Using PayHero's transaction status check
      const status = await AppPayHero.transactionStatus(reference);
      console.log('Payment status check:', status);
      
      return status;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  };

  // Start polling for payment status
  const startPaymentPolling = (reference) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 6 seconds = 3 minutes max
    
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = setInterval(async () => {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}`);
      
      const status = await checkPaymentStatus(reference);
      
      if (status && status.paid === true) {
        // Payment successful
        clearInterval(interval);
        setPollingInterval(null);
        setIsProcessing(false);
        
        localStorage.setItem('crbPaymentVerified', 'true');
        
        Swal.fire({
          title: "Payment Successful! 🎉",
          html: `
            <div style="text-align: center;">
              <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
              <h3 style="margin: 15px 0;">KSh ${depositAmount} Paid</h3>
              <p>Service fee payment completed successfully</p>
              <p style="font-size: 0.9rem; color: #666;">Reference: ${reference}</p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "View Results",
        }).then(() => {
          navigate("/credit-check-status");
        });
        return;
      }
      
      if (status && status.paid === false) {
        // Check if we've exceeded max attempts
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
          }).then((result) => {
            if (result.isConfirmed) {
              // Allow user to try again
              setPaymentReference(null);
            }
          });
          return;
        }
      }
    }, 6000); // Check every 6 seconds
    
    setPollingInterval(interval);
  };

  // STK Push payment method
  const payWithPayHeroStk = async () => {
    if (!userData.phone) {
      Swal.fire({
        title: "Phone Number Required",
        text: "Please complete the CRB check form first to provide your phone number",
        icon: "warning",
      });
      return;
    }

    // Confirmation modal
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

    setIsProcessing(true);
    
    // Generate a unique reference for this transaction
    const reference = `CRB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setPaymentReference(reference);

    const paymentDetails = {
      amount: depositAmount,
      phone_number: userData.phone,
      channel_id: 6218,
      provider: "m-pesa",
      external_reference: reference,
      callback_url: "https://goalkings.live"
    };

    try {
      const response = await AppPayHero.makeStkPush(paymentDetails);
      console.log('STK Push response:', response);
      
      // Show awaiting payment modal
      Swal.fire({
        title: "Check Your Phone",
        html: `
          <div style="text-align: center;">
            <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
            <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
            <p>Check your phone to authorize payment of <strong>KSh ${depositAmount}</strong></p>
            <p><small>Phone: ${formatPhoneNumber(userData.phone)}</small></p>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">Waiting for payment confirmation...</p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "I've Made the Payment",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // User confirmed they made the payment, start polling
          startPaymentPolling(reference);
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
      
    } catch (error) {
      console.error('STK Push error:', error);
      setIsProcessing(false);
      Swal.fire({
        title: "Payment Initiation Failed",
        html: `
          <div style="text-align: center;">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #dc2626;"></i>
            <h3 style="margin: 15px 0;">Unable to Initiate Payment</h3>
            <p>${error.message || "Please check your network connection and try again."}</p>
          </div>
        `,
        icon: "error",
        confirmButtonText: "Try Again",
      });
    }
  };

  // Pesapal payment method (not called yet)
  const payWithPesapalStk = async () => {
    if (!userData.phone) {
      Swal.fire({
        title: "Phone Number Required",
        text: "Please complete the CRB check form first to provide your phone number",
        icon: "warning",
      });
      return;
    }

    // Confirmation modal
    const { value: confirmed } = await Swal.fire({
      title: "Confirm Service Fee Payment",
      html: `
        <div style="text-align: center;">
          <p>Service Fee: <strong>KSh ${depositAmount.toLocaleString()}</strong></p>
          <p>Phone: <strong>${userData.phone}</strong></p>
          <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
            You will be redirected to Pesapal to complete payment
          </p>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proceed to Pesapal",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#059669",
    });

    if (!confirmed) return;

    setIsProcessing(true);
    
    const pesapalPaymentDetails = {
      currency: 'KES',
      amount: depositAmount,
      description: 'CRB Status Check Service Fee',
      customerEmail: 'customer@example.com', // You can collect this from user
      customerFirstName: 'CRB',
      customerLastName: 'User',
      phoneNumber: formatPhoneNumber(userData.phone),
      countryCode: 'KE'
    };

    try {
      const { orderTrackingId, merchantReference, redirectUrl } = await AppPayHero.initiatePesapalPayment(pesapalPaymentDetails);
      console.log('Pesapal payment initiated:', { orderTrackingId, merchantReference, redirectUrl });
      
      setPaymentReference(orderTrackingId);
      
      // Open Pesapal payment page in new window
      const paymentWindow = window.open(redirectUrl, '_blank', 'width=800,height=600');
      
      Swal.fire({
        title: "Pesapal Payment",
        html: `
          <div style="text-align: center;">
            <i class="fas fa-credit-card" style="font-size: 48px; color: #065f46;"></i>
            <h3 style="margin: 15px 0;">Complete Payment on Pesapal</h3>
            <p>Complete your payment on the Pesapal payment page.</p>
            <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
              Amount: <strong>KSh ${depositAmount}</strong><br>
              Reference: ${orderTrackingId}
            </p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "I've Completed Payment",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // Start polling for payment status
          startPaymentPolling(orderTrackingId);
        } else {
          setIsProcessing(false);
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }
        }
      });
      
    } catch (error) {
      console.error('Pesapal payment error:', error);
      setIsProcessing(false);
      Swal.fire({
        title: "Payment Initiation Failed",
        text: error.message || "Unable to initiate Pesapal payment. Please try again.",
        icon: "error",
        confirmButtonText: "Try Again",
      });
    }
  };

  return (
    <div>
      <div className="deposit-card">
        <div className="deposit-title">Service Fee Payment</div>

        <div className="amount-input">
          <label>Payment Amount: KSh {depositAmount}</label>
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
            <li>Enter your M-Pesa PIN to authorize payment of KSh {depositAmount}</li>
            <li>After successful payment, view your CRB status results</li>
          </ul>
        </div>

        <button
          className="deposit-btn"
          onClick={payWithPayHeroStk}
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