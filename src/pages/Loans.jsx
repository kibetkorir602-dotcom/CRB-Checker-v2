import React, { useState, useEffect, useRef } from "react";
import './Loans.css'

const Loans = () => {

  const [loanAmount, setLoanAmount] = useState(100000);
  const [loanTerm, setLoanTerm] = useState(12);
  const [phoneNumber, setPhoneNumber] = useState("0700 000 000");
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalRepayment, setTotalRepayment] = useState(0);
  
  const calculatorRef = useRef(null);
  const applyRef = useRef(null);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate loan
  const calculateLoan = () => {
    const monthlyInterestRate = 0.02; // 2%
    const monthly = Math.round((loanAmount * monthlyInterestRate) + (loanAmount / loanTerm));
    const total = monthly * loanTerm;
    
    setMonthlyPayment(monthly);
    setTotalRepayment(total);
  };

  // Navigation functions
  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToApply = () => {
    applyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Apply now function
  const applyNow = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    const message = `Thank you for your application!\n\nLoan Details:\nAmount: KSh ${formatNumber(loanAmount)}\nTerm: ${loanTerm} months\n\nWe will contact you at ${phoneNumber} within 15 minutes to proceed with your logbook loan application.`;
    
    alert(message);
    
    // In a real application, this would submit to a server
    console.log("Application submitted:", { loanAmount, loanTerm, phoneNumber });
  };

  // Initialize calculations on component mount and when values change
  useEffect(() => {
    calculateLoan();
  }, [loanAmount, loanTerm]);

  // Handle phone number input focus
  const handlePhoneFocus = () => {
    if (phoneNumber === "0700 000 000") {
      setPhoneNumber("");
    }
  };

  const handlePhoneBlur = () => {
    if (phoneNumber === "") {
      setPhoneNumber("0700 000 000");
    }
  };

  return (
    <div>
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-tagline">
                Quick Loans with Zero Hidden Fees
              </div>
              <h1>Same Day Car Logbook Loans in Kenya – Approval in 15 Minutes</h1>
              <p>Unlock the value of your vehicle and get the cash you need today. Fast approval, flexible terms, and keep driving your car while you repay.</p>
              <div className="hero-buttons">
                <button className="btn btn-primary" onClick={scrollToCalculator}>
                  <i className="fas fa-calculator"></i> Calculate Your Loan
                </button>
                <button className="btn btn-outline" onClick={scrollToApply}>
                  <i className="fas fa-paper-plane"></i> Apply Now
                </button>
              </div>
            </div>
            <div className="hero-image">
              <img src="https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Happy customer with car keys" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-title">
            <h2>Why Choose Our Logbook Loans</h2>
            <p>Fast, flexible, and affordable car logbook loans designed for Kenyans</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <h3>Get Funds in 6 Hours</h3>
              <p>Your loan is approved and disbursed to your account in 6 hours or less.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h3>Borrow Up to KSh 25M</h3>
              <p>Access significant capital by borrowing up to KSh 25 million against your vehicle.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Bad Credit Not a Barrier</h3>
              <p>Your vehicle is the primary security, not your CRB listing or credit history.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h3>You Choose Your Term</h3>
              <p>Repay your loan comfortably with flexible plans ranging from 1 to 24 months.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="calculator-section" id="calculator" ref={calculatorRef}>
        <div className="container">
          <div className="calculator-content">
            <div className="calculator-box">
              <h2 className="calculator-title">Calculate Your Loan</h2>
              
              <div className="form-group">
                <label htmlFor="loanAmount">Loan Amount (KSh)</label>
                <div className="range-container">
                  <input 
                    type="range" 
                    id="loanAmount" 
                    min="50000" 
                    max="25000000" 
                    step="10000" 
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                    className="form-control"
                  />
                  <div className="range-value" id="loanAmountValue">
                    {formatNumber(loanAmount)}
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="loanTerm">Repayment Period (Months)</label>
                <div className="range-container">
                  <input 
                    type="range" 
                    id="loanTerm" 
                    min="1" 
                    max="24" 
                    step="1" 
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                    className="form-control"
                  />
                  <div className="range-value" id="loanTermValue">
                    {loanTerm} Month{loanTerm > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input 
                  type="tel" 
                  id="phoneNumber" 
                  className="form-control" 
                  placeholder="0700 000 000" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onFocus={handlePhoneFocus}
                  onBlur={handlePhoneBlur}
                />
              </div>
              
              <div className="data-protection">
                <i className="fas fa-lock"></i> Data Protection Act Compliant: Your information is secure and used only for this loan.
              </div>
              
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "25px" }} onClick={applyNow}>
                <i className="fas fa-paper-plane"></i> Apply for This Loan
              </button>
            </div>
            
            <div>
              <div className="calculator-result">
                <h3 style={{ color: "var(--primary)", marginBottom: "25px" }}>Your Loan Summary</h3>
                
                <div className="result-row">
                  <div className="result-label">Total Loan Amount</div>
                  <div className="result-value" id="resultLoanAmount">
                    KSh {formatNumber(loanAmount)}
                  </div>
                </div>
                
                <div className="result-row">
                  <div className="result-label">Monthly Interest Rate</div>
                  <div className="result-value">2%</div>
                </div>
                
                <div className="result-row">
                  <div className="result-label">Loan Term</div>
                  <div className="result-value" id="resultTerm">
                    {loanTerm} Month{loanTerm > 1 ? "s" : ""}
                  </div>
                </div>
                
                <div className="result-row">
                  <div className="result-label">Monthly Payment</div>
                  <div className="result-value" id="resultMonthly">
                    KSh {formatNumber(monthlyPayment)}
                  </div>
                </div>
                
                <div className="result-row">
                  <div className="result-label">Total Repayment</div>
                  <div className="result-value" id="resultTotal">
                    KSh {formatNumber(totalRepayment)}
                  </div>
                </div>
                
                <div className="result-highlight" id="resultTakeHome">
                  You Get: KSh {formatNumber(loanAmount)}
                </div>
                
                <p style={{ marginTop: "15px", color: "var(--gray)", fontSize: "14px" }}>
                  <i className="fas fa-info-circle"></i> No hidden fees. You receive the full loan amount.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Are Logbook Loans Section */}
      <section className="explanation-section">
        <div className="container">
          <div className="explanation-content">
            <div>
              <img src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Car logbook" style={{ width: "100%", borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
            </div>
            <div className="explanation-text">
              <h2>What Are Logbook Loans?</h2>
              <p>Discover how logbook loans can provide the financial support you need!</p>
              <p>Logbook loans are a type of secured loan allowing you to borrow money using your vehicle as collateral. Essentially, you temporarily transfer your vehicle's ownership to us while still enjoying its use during the repayment period.</p>
              
              <ul className="benefits-list">
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Quick Access to Cash:</strong> Gain immediate financial relief with minimal requirements.
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Flexible Funding Limits:</strong> Borrow 40% to 90% of your vehicle's current market value.
                  </div>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Easy Repayment Options:</strong> Choose repayment plans that fit your budget, ranging from 3 to 24 months.
                  </div>
                </li>
              </ul>
              
              <h3 style={{ marginTop: "30px", color: "var(--primary)" }}>Who Qualifies?</h3>
              <ul className="benefits-list">
                <li><i className="fas fa-user-check"></i> Must be at least 18 years old.</li>
                <li><i className="fas fa-car"></i> Legally own the vehicle.</li>
                <li><i className="fas fa-file-contract"></i> Vehicle must be free of finance.</li>
                <li><i className="fas fa-shield-alt"></i> Valid comprehensive insurance.</li>
              </ul>
              
              <button className="btn btn-primary" style={{ marginTop: "30px" }} onClick={scrollToApply}>
                <i className="fas fa-rocket"></i> Ready to Get Started?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="container">
          <div className="section-title">
            <h2>Top Benefits of CRB Logbook Loans</h2>
            <p>You can enjoy the convenience of car logbook loans from CRB Credit today as part of our trusted services.</p>
          </div>
          
          <div className="why-choose-grid">
            <div className="why-choose-card">
              <h3>Fast Approval & Disbursement</h3>
              <p>Get your loan approved within 15 minutes and access funds the same day. Our streamlined process ensures you get the money when you need it most.</p>
            </div>
            
            <div className="why-choose-card">
              <h3>Retain Full Use of Your Vehicle</h3>
              <p>Continue driving your car while repaying the loan. We only hold the logbook as security - you keep driving your vehicle as normal.</p>
            </div>
            
            <div className="why-choose-card">
              <h3>No Hidden Fees</h3>
              <p>Enjoy a clear, straightforward loan process with full transparency. What you see is what you get - no surprises.</p>
            </div>
            
            <div className="why-choose-card">
              <h3>High Loan Limits</h3>
              <p>Borrow up to KSH 25,000,000 with flexible repayment terms of up to 24 months. Get the capital you need for any purpose.</p>
            </div>
            
            <div className="why-choose-card">
              <h3>Bad Credit Welcome</h3>
              <p>Your credit history doesn't matter. We assess your loan based on your vehicle's value, not your CRB status.</p>
            </div>
            
            <div className="why-choose-card">
              <h3>Nationwide Service</h3>
              <p>We serve customers across all counties in Kenya. Wherever you are, we can process your logbook loan application.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="apply" ref={applyRef}>
        <div className="container">
          <h2>Unlock Quick Cash with Logbook Loans</h2>
          <p>Need a fast and flexible loan? CRB Credit Limited offers reliable logbook loans in Kenya, allowing you to leverage your vehicle as collateral for affordable financing. Enjoy competitive interest rates, a quick approval process, and a secure, transparent borrowing experience.</p>
          
          <div className="cta-buttons">
            <button className="btn btn-primary" onClick={applyNow} style={{ padding: "18px 40px", fontSize: "18px" }}>
              <i className="fas fa-rocket"></i> APPLY NOW
            </button>
            <button className="btn btn-outline" onClick={scrollToCalculator} style={{ padding: "18px 40px", fontSize: "18px" }}>
              <i className="fas fa-phone-alt"></i> CALL: 0709 607 000
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Loans;