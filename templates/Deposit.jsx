import React, { useState, useEffect } from "react";
import "./deposit.css";
import Swal from "sweetalert2";

function Deposit() {
  const [userData, setUserData] = useState({});
  const [depositAmount, setDepositAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load user data
    const data = JSON.parse(localStorage.getItem('sportbet_user') || '{}');
    if (!data.loggedIn) {
      window.location.href = 'login.html';
    }
    setUserData(data);
    
    // Set active amount button
    setActiveAmountButton(100);
  }, []);

  const setActiveAmountButton = (amount) => {
    // Remove active class from all buttons
    document.querySelectorAll('.amount-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Find and activate the correct button
    const buttons = document.querySelectorAll('.amount-btn');
    buttons.forEach(btn => {
      if (btn.textContent.replace(/,/g, '') === amount.toString()) {
        btn.classList.add('active');
      }
    });
  };

  const handleSetAmount = (amount) => {
    setDepositAmount(amount);
    setActiveAmountButton(amount);
  };

  const formatPhoneNumber = (phone) => {
    let p = phone.toString().replace(/\D/g, '');
    if (p.startsWith('0')) {
      return '254' + p.substring(1);
    }
    if (p.startsWith('7') || p.startsWith('1')) {
      return '254' + p;
    }
    if (p.startsWith('254')) {
      return p;
    }
    return p;
  };

  const generateRandomEmail = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
    
    let username = '';
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

  const startPaymentPolling = (reference, amount) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        Swal.fire({
          title: 'Payment Timeout',
          html: '⏰ Payment monitoring timeout. Please check your transaction history.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      attempts++;
      
      try {
        const response = await fetch(`https://genuine-flow-production-b0ae.up.railway.app/api/status/${reference}`);
        const data = await response.json();
        
        if (data.success) {
          if (data.paid) {
            // Payment successful
            Swal.fire({
              title: 'Deposit Successful! 🎉',
              html: `
                <div style="text-align: center;">
                  <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                  <h3 style="margin: 15px 0;">KSh ${amount} Deposited</h3>
                  <p>Funds have been added to your account</p>
                </div>
              `,
              icon: 'success',
              confirmButtonText: 'Continue'
            }).then(() => {
              // Update user balance
              const updatedUserData = {
                ...userData,
                balance: (parseFloat(userData.balance) || 0) + amount
              };
              setUserData(updatedUserData);
              localStorage.setItem('sportbet_user', JSON.stringify(updatedUserData));
              
              // Save transaction
              const transaction = {
                id: Date.now(),
                type: 'deposit',
                amount: amount,
                status: 'completed',
                time: new Date().toISOString(),
                reference: reference
              };
              
              let transactions = JSON.parse(localStorage.getItem('sportbet_transactions') || '[]');
              transactions.push(transaction);
              localStorage.setItem('sportbet_transactions', JSON.stringify(transactions));
              
              window.location.href = 'profile.html';
            });
            return;
          }
          
          if (data.can_retry) {
            Swal.fire({
              title: 'Payment Not Completed',
              html: '⚠️ Payment not completed. You can try again.',
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            return;
          }
          
          // Continue polling
          setTimeout(checkStatus, 6000);
        }
      } catch (error) {
        console.error('Status check error:', error);
        setTimeout(checkStatus, 6000);
      }
    };
    
    setTimeout(checkStatus, 6000);
  };

  const submitOTP = async (reference, otp) => {
    try {
      const response = await fetch('https://genuine-flow-production-b0ae.up.railway.app/api/submit-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otp.trim(),
          reference: reference
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return true;
      } else {
        Swal.showValidationMessage(data.message || 'Invalid OTP. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('OTP Error:', error);
      Swal.showValidationMessage('OTP verification failed. Please try again.');
      return false;
    }
  };

  const handleDeposit = async () => {
    if (depositAmount < 10) {
      Swal.fire({
        title: 'Invalid Amount',
        text: 'Minimum deposit is KSh 10',
        icon: 'warning'
      });
      return;
    }

    if (depositAmount > 150000) {
      Swal.fire({
        title: 'Amount Too High',
        text: 'Maximum deposit is KSh 150,000',
        icon: 'warning'
      });
      return;
    }

    // Show confirmation
    const { value: confirmed } = await Swal.fire({
      title: 'Confirm Deposit',
      html: `
        <div style="text-align: center;">
          <p>Deposit Amount: <strong>KSh ${depositAmount.toLocaleString()}</strong></p>
          <p>Phone: <strong>${userData.phone}</strong></p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Proceed to M-Pesa',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed) return;

    Swal.fire({
      title: 'Processing...',
      text: 'Initiating M-Pesa payment',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    setIsProcessing(true);

    try {
      const formattedPhone = formatPhoneNumber(userData.phone);
      const email = generateRandomEmail();
      
      // Call payment API
      const response = await fetch('https://genuine-flow-production-b0ae.up.railway.app/api/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          amount: depositAmount,
          phone: formattedPhone
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.status === 'success') {
          // Immediate success
          Swal.fire({
            title: 'Deposit Successful! 🎉',
            html: `
              <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #10b981;"></i>
                <h3 style="margin: 15px 0;">KSh ${depositAmount} Deposited</h3>
                <p>Funds added to your account</p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Continue'
          }).then(() => {
            const updatedUserData = {
              ...userData,
              balance: (parseFloat(userData.balance) || 0) + depositAmount
            };
            setUserData(updatedUserData);
            localStorage.setItem('sportbet_user', JSON.stringify(updatedUserData));
            window.location.href = 'profile.html';
          });
        } else if (data.requires_authorization) {
          // STK Push
          Swal.fire({
            title: 'Check Your Phone',
            html: `
              <div style="text-align: center;">
                <i class="fas fa-mobile-alt" style="font-size: 48px; color: #065f46;"></i>
                <h3 style="margin: 15px 0;">Enter M-Pesa PIN</h3>
                <p>Check your phone to authorize payment of <strong>KSh ${depositAmount}</strong></p>
                <p><small>Phone: ${formattedPhone}</small></p>
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'OK'
          }).then(() => {
            startPaymentPolling(data.reference, depositAmount);
          });
        } else if (data.requires_otp) {
          // OTP flow
          Swal.fire({
            title: 'OTP Required',
            html: '📱 OTP sent! Please check your phone for the authorization code.',
            input: 'text',
            inputPlaceholder: 'Enter OTP',
            showCancelButton: true,
            confirmButtonText: 'Submit OTP',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: async (otp) => {
              if (!otp) {
                Swal.showValidationMessage('Please enter the OTP');
                return false;
              }
              return await submitOTP(data.reference, otp);
            }
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              startPaymentPolling(data.reference, depositAmount);
            }
          });
        } else {
          // Generic success
          Swal.fire({
            title: 'Payment Initiated',
            html: `📱 ${data.message || 'Payment processing...'}`,
            icon: 'info',
            confirmButtonText: 'OK'
          }).then(() => {
            startPaymentPolling(data.reference, depositAmount);
          });
        }
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    } catch (error) {
      Swal.fire({
        title: 'Payment Failed',
        text: error.message || 'Unable to process payment. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try Again'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <a href="profile.html" className="back-btn">
            <i className="fas fa-arrow-left"></i>
          </a>
          <h1>Deposit Funds</h1>
          <div style={{ width: '40px' }}></div>
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-label">Current Balance</div>
        <div className="balance-amount" id="currentBalance">
          KSh {userData.balance?.toFixed(2) || '0.00'}
        </div>
      </div>

      <div className="deposit-card">
        <div className="deposit-title">Deposit Amount</div>
        
        <div className="amount-input">
          <label>Enter Amount (KSh)</label>
          <input 
            type="number" 
            className="amount-field" 
            id="depositAmount" 
            placeholder="0.00" 
            min="10" 
            value={depositAmount}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setDepositAmount(value);
              setActiveAmountButton(value);
            }}
          />
          
          <div className="quick-amounts">
            <button className="amount-btn" onClick={() => handleSetAmount(100)}>100</button>
            <button className="amount-btn" onClick={() => handleSetAmount(500)}>500</button>
            <button className="amount-btn" onClick={() => handleSetAmount(1000)}>1,000</button>
            <button className="amount-btn" onClick={() => handleSetAmount(2000)}>2,000</button>
            <button className="amount-btn" onClick={() => handleSetAmount(5000)}>5,000</button>
            <button className="amount-btn" onClick={() => handleSetAmount(10000)}>10,000</button>
          </div>
        </div>

        <div className="mpesa-info">
          <h4><i className="fas fa-info-circle"></i> M-Pesa Deposit</h4>
          <ul>
            <li>Enter the amount you wish to deposit</li>
            <li>Click "Deposit via M-Pesa"</li>
            <li>Enter your M-Pesa PIN when prompted on your phone</li>
            <li>Funds will be added instantly to your account</li>
          </ul>
        </div>

        <button 
          className="deposit-btn" 
          id="depositBtn" 
          onClick={handleDeposit}
          disabled={isProcessing}
        >
          <i className="fas fa-mobile-alt"></i> 
          {isProcessing ? 'Processing...' : 'Deposit via M-Pesa'}
        </button>
      </div>
    </div>
  );
}

export default Deposit;