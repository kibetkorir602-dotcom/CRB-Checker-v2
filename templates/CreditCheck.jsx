import React, { useState, useEffect, useRef } from "react";
import "./creditcheck.css"; // We'll create this CSS file

const CreditCheck = () => {
  const [formData, setFormData] = useState({
    fullName: "John Mwangi",
    idNumber: "12345678",
    phoneNumber: "0712 345 678",
    emailAddress: "john.mwangi@example.com",
    crbOption: "creditinfo"
  });
  
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  const resultsRef = useRef(null);
  const checkerRef = useRef(null);
  const loanAppsRef = useRef(null);

  // Navigation functions
  const scrollToChecker = () => {
    checkerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLoanApps = () => {
    loanAppsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Perform CRB check
  const performCRBCheck = () => {
    // Basic validation
    if (!formData.fullName || !formData.idNumber || !formData.phoneNumber || !formData.emailAddress || !formData.crbOption) {
      alert('Please fill in all required fields before checking your credit status.');
      return;
    }

    // Generate random results for demonstration
    const checkId = 'CRB-' + Math.floor(10000 + Math.random() * 90000);
    const statusOptions = ['Good Standing', 'Default Listed', 'Watch List'];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // Format date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB');
    
    // Set CRB name
    let crbName = '';
    switch(formData.crbOption) {
      case 'creditinfo': crbName = 'Creditinfo Kenya'; break;
      case 'metropol': crbName = 'Metropol Credit Reference Bureau'; break;
      case 'transunion': crbName = 'TransUnion Kenya'; break;
      default: crbName = 'Credit Reference Bureau';
    }
    
    // Set status and details based on random result
    let resultDetails = {
      name: formData.fullName,
      id: formData.idNumber,
      phone: formData.phoneNumber,
      crb: crbName,
      date: formattedDate,
      status: randomStatus,
      statusClass: randomStatus === 'Good Standing' ? 'status-clear' : 
                   randomStatus === 'Default Listed' ? 'status-flagged' : 'status-warning',
      statusText: randomStatus === 'Good Standing' ? 'No negative listings - Eligible for credit' :
                  randomStatus === 'Default Listed' ? 'Has defaulted on loan payments - Not eligible for new credit' :
                  'Some late payments - Limited credit options available'
    };
    
    if (randomStatus === 'Good Standing') {
      resultDetails.score = Math.floor(600 + Math.random() * 200) + '/900 (Good)';
      resultDetails.loans = Math.floor(1 + Math.random() * 3) + ' active loans (KSh ' + Math.floor(10000 + Math.random() * 150000) + ' total)';
      resultDetails.history = (85 + Math.floor(Math.random() * 15)) + '% on-time payments';
    } else if (randomStatus === 'Default Listed') {
      resultDetails.score = Math.floor(300 + Math.random() * 150) + '/900 (Poor)';
      resultDetails.loans = Math.floor(1 + Math.random() * 4) + ' loans (1 default)';
      resultDetails.history = (40 + Math.floor(Math.random() * 30)) + '% on-time payments';
    } else {
      resultDetails.score = Math.floor(450 + Math.random() * 150) + '/900 (Fair)';
      resultDetails.loans = Math.floor(1 + Math.random() * 3) + ' active loans';
      resultDetails.history = (70 + Math.floor(Math.random() * 20)) + '% on-time payments';
    }
    
    setResults(resultDetails);
    setShowResults(true);
    
    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    // Show success message
    alert('CRB check completed successfully. Results are displayed below.');
  };

  // Apply for loan function
  const applyForLoan = (loanApp) => {
    alert('This is a demonstration. In a real application, you would be redirected to apply for a loan with ' + loanApp + '.');
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h2>Check Your Credit Status with Kenya's CRB</h2>
              <p>CreditCheck Kenya helps you access your credit report from licensed Credit Reference Bureaus in Kenya. Check your credit score, get clearance certificates, and find loan options tailored to your financial profile.</p>
              <button className="btn btn-primary" onClick={scrollToChecker}>Check Credit Status <i className="fas fa-arrow-right"></i></button>
              <button className="btn btn-secondary" onClick={scrollToLoanApps} style={{ marginLeft: "10px" }}>View Loan Apps <i className="fas fa-mobile-alt"></i></button>
            </div>
            <div className="hero-image">
              <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Financial Services in Kenya" />
            </div>
          </div>
        </div>
      </section>

      {/* Checker Section */}
      <section className="checker-section" id="checker" ref={checkerRef}>
        <div className="container">
          <div className="section-title">
            <h2>Check Your CRB Status</h2>
            <p>Enter your details to check your credit status with Kenya's Credit Reference Bureaus. This is a simulated check for demonstration purposes.</p>
          </div>
          
          <div className="checker-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input 
                type="text" 
                id="fullName" 
                className="form-control" 
                placeholder="Enter your full name as per ID"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="idNumber">National ID / Passport Number *</label>
                <input 
                  type="text" 
                  id="idNumber" 
                  className="form-control" 
                  placeholder="Enter your ID or Passport Number"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input 
                  type="text" 
                  id="phoneNumber" 
                  className="form-control" 
                  placeholder="e.g., 0712 345 678"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="emailAddress">Email Address *</label>
              <input 
                type="email" 
                id="emailAddress" 
                className="form-control" 
                placeholder="Enter your email address"
                value={formData.emailAddress}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="crbOption">Select CRB Bureau *</label>
              <select 
                id="crbOption" 
                className="form-control"
                value={formData.crbOption}
                onChange={handleInputChange}
              >
                <option value="">Select a Credit Reference Bureau</option>
                <option value="creditinfo">Creditinfo Kenya</option>
                <option value="metropol">Metropol Credit Reference Bureau</option>
                <option value="transunion">TransUnion Kenya</option>
              </select>
            </div>
            
            <div className="form-footer">
              <div className="disclaimer">
                <i className="fas fa-lock"></i> Your information is secure and encrypted. This is a demonstration only.
              </div>
              <button className="btn btn-primary" onClick={performCRBCheck}>Check Credit Status <i className="fas fa-search"></i></button>
            </div>
          </div>
        </div>
      </section>

      {/* CRB Options Section */}
      <section className="crb-options" id="crb-options">
        <div className="container">
          <div className="section-title">
            <h2>Licensed CRB Bureaus in Kenya</h2>
            <p>These are the official Credit Reference Bureaus licensed by the Central Bank of Kenya (CBK)</p>
          </div>
          
          <div className="crb-grid">
            <div className="crb-card">
              <div className="crb-icon">
                <i className="fas fa-building"></i>
              </div>
              <h3>Creditinfo Kenya</h3>
              <p>One of the leading CRBs in Kenya providing comprehensive credit information and risk management solutions.</p>
              <p><strong>USSD Code:</strong> *433#</p>
            </div>
            
            <div className="crb-card">
              <div className="crb-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Metropol CRB</h3>
              <p>Provides credit reports, scores and certificates. Popular for SME and individual credit assessments.</p>
              <p><strong>USSD Code:</strong> *433#</p>
            </div>
            
            <div className="crb-card">
              <div className="crb-icon">
                <i className="fas fa-globe"></i>
              </div>
              <h3>TransUnion Kenya</h3>
              <p>Global credit bureau with local presence in Kenya, offering credit information and analytics services.</p>
              <p><strong>USSD Code:</strong> *433#</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="results-section" id="results" ref={resultsRef}>
        <div className="container">
          <div className="section-title">
            <h2>Your Credit Status Results</h2>
            <p>Based on the information provided, here is your simulated credit status report.</p>
          </div>
          
          <div className="results-card" style={{ display: showResults ? 'block' : 'none' }}>
            {results && (
              <>
                <div className="results-header">
                  <h3>CRB Credit Report</h3>
                  <div className={`result-status ${results.statusClass}`}>
                    {results.status}
                  </div>
                </div>
                
                <div className="results-details">
                  <div className="detail-row">
                    <div className="detail-label">Full Name:</div>
                    <div className="detail-value">{results.name}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">ID Number:</div>
                    <div className="detail-value">{results.id}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Phone Number:</div>
                    <div className="detail-value">{results.phone}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">CRB Bureau:</div>
                    <div className="detail-value">{results.crb}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Credit Score:</div>
                    <div className="detail-value">{results.score}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Status:</div>
                    <div className="detail-value"><span>{results.statusText}</span></div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Active Loans:</div>
                    <div className="detail-value">{results.loans}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Payment History:</div>
                    <div className="detail-value">{results.history}</div>
                  </div>
                </div>
                
                <div className="verification-date">
                  <i className="far fa-calendar-alt"></i> Report generated on: <span>{results.date}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Loan Apps Section */}
      <section className="loan-apps-section" id="loan-apps" ref={loanAppsRef}>
        <div className="container">
          <div className="section-title">
            <h2>Popular Loan Apps in Kenya</h2>
            <p>Based on your credit status, here are loan options you may be eligible for.</p>
          </div>
          
          <div className="loan-apps-grid">
            {/* Tala */}
            <div className="loan-app-card">
              <div className="loan-app-header">
                <div className="loan-app-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <div className="loan-app-info">
                  <h3>Tala</h3>
                  <p>Fast, unsecured loans with growing limits</p>
                </div>
              </div>
              <div className="loan-app-details">
                <p><i className="fas fa-money-bill-wave"></i> <strong>Loan Limit:</strong> KSh 500 - KSh 50,000</p>
                <p><i className="fas fa-percentage"></i> <strong>Interest Rate:</strong> 15% - 30% p.a.</p>
                <p><i className="fas fa-clock"></i> <strong>Disbursement:</strong> Within minutes</p>
              </div>
              <div className="eligibility eligible">
                <i className="fas fa-check-circle"></i>
                <span>You are eligible for this loan app</span>
              </div>
              <div className="loan-app-actions">
                <div className="loan-app-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                  <span style={{ marginLeft: "5px", color: "var(--gray)" }}>4.5</span>
                </div>
                <button className="btn btn-primary" onClick={() => applyForLoan('Tala')}>Apply Now</button>
              </div>
            </div>
            
            {/* Branch */}
            <div className="loan-app-card">
              <div className="loan-app-header">
                <div className="loan-app-icon">
                  <i className="fas fa-code-branch"></i>
                </div>
                <div className="loan-app-info">
                  <h3>Branch</h3>
                  <p>Personal loans through simple, paperless process</p>
                </div>
              </div>
              <div className="loan-app-details">
                <p><i className="fas fa-money-bill-wave"></i> <strong>Loan Limit:</strong> KSh 1,000 - KSh 70,000</p>
                <p><i className="fas fa-percentage"></i> <strong>Interest Rate:</strong> 14% - 28% p.a.</p>
                <p><i className="fas fa-clock"></i> <strong>Disbursement:</strong> Instant to M-Pesa</p>
              </div>
              <div className="eligibility eligible">
                <i className="fas fa-check-circle"></i>
                <span>You are eligible for this loan app</span>
              </div>
              <div className="loan-app-actions">
                <div className="loan-app-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="far fa-star"></i>
                  <span style={{ marginLeft: "5px", color: "var(--gray)" }}>4.0</span>
                </div>
                <button className="btn btn-primary" onClick={() => applyForLoan('Branch')}>Apply Now</button>
              </div>
            </div>
            
            {/* M-Pesa */}
            <div className="loan-app-card">
              <div className="loan-app-header">
                <div className="loan-app-icon">
                  <i className="fas fa-sim-card"></i>
                </div>
                <div className="loan-app-info">
                  <h3>M-Pesa</h3>
                  <p>Mobile money platform with lending services</p>
                </div>
              </div>
              <div className="loan-app-details">
                <p><i className="fas fa-money-bill-wave"></i> <strong>Loan Limit:</strong> KSh 100 - KSh 150,000</p>
                <p><i className="fas fa-percentage"></i> <strong>Interest Rate:</strong> 7.5% - 10% p.a.</p>
                <p><i className="fas fa-clock"></i> <strong>Disbursement:</strong> Instant to M-Pesa</p>
              </div>
              <div className="eligibility eligible">
                <i className="fas fa-check-circle"></i>
                <span>You are eligible for this loan app</span>
              </div>
              <div className="loan-app-actions">
                <div className="loan-app-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <span style={{ marginLeft: "5px", color: "var(--gray)" }}>4.8</span>
                </div>
                <button className="btn btn-primary" onClick={() => applyForLoan('M-Pesa')}>Apply Now</button>
              </div>
            </div>
            
            {/* KCB Mobile */}
            <div className="loan-app-card">
              <div className="loan-app-header">
                <div className="loan-app-icon">
                  <i className="fas fa-university"></i>
                </div>
                <div className="loan-app-info">
                  <h3>KCB Mobile</h3>
                  <p>Mobile banking app with integrated loan services</p>
                </div>
              </div>
              <div className="loan-app-details">
                <p><i className="fas fa-money-bill-wave"></i> <strong>Loan Limit:</strong> KSh 1,000 - KSh 1,000,000</p>
                <p><i className="fas fa-percentage"></i> <strong>Interest Rate:</strong> 8% - 15% p.a.</p>
                <p><i className="fas fa-clock"></i> <strong>Disbursement:</strong> Within 24 hours</p>
              </div>
              <div className="eligibility not-eligible">
                <i className="fas fa-times-circle"></i>
                <span>Requires KCB bank account</span>
              </div>
              <div className="loan-app-actions">
                <div className="loan-app-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                  <span style={{ marginLeft: "5px", color: "var(--gray)" }}>4.3</span>
                </div>
                <button className="btn btn-outline" onClick={() => applyForLoan('KCB Mobile')}>Learn More</button>
              </div>
            </div>
            
            {/* Zenka */}
            <div className="loan-app-card">
              <div className="loan-app-header">
                <div className="loan-app-icon">
                  <i className="fas fa-wind"></i>
                </div>
                <div className="loan-app-info">
                  <h3>Zenka</h3>
                  <p>Flexible personal loans with quick disbursement</p>
                </div>
              </div>
              <div className="loan-app-details">
                <p><i className="fas fa-money-bill-wave"></i> <strong>Loan Limit:</strong> KSh 500 - KSh 30,000</p>
                <p><i className="fas fa-percentage"></i> <strong>Interest Rate:</strong> 9% - 30% p.a.</p>
                <p><i className="fas fa-clock"></i> <strong>Disbursement:</strong> Within 5 minutes</p>
              </div>
              <div className="eligibility eligible">
                <i className="fas fa-check-circle"></i>
                <span>You are eligible for this loan app</span>
              </div>
              <div className="loan-app-actions">
                <div className="loan-app-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="far fa-star"></i>
                  <span style={{ marginLeft: "5px", color: "var(--gray)" }}>4.1</span>
                </div>
                <button className="btn btn-primary" onClick={() => applyForLoan('Zenka')}>Apply Now</button>
              </div>
            </div>
            
            {/* Timiza */}
            <div className="loan-app-card">
              <div className="loan-app-header">
                <div className="loan-app-icon">
                  <i className="fas fa-hand-holding-usd"></i>
                </div>
                <div className="loan-app-info">
                  <h3>Timiza</h3>
                  <p>Absa Bank mobile loan product</p>
                </div>
              </div>
              <div className="loan-app-details">
                <p><i className="fas fa-money-bill-wave"></i> <strong>Loan Limit:</strong> KSh 500 - KSh 300,000</p>
                <p><i className="fas fa-percentage"></i> <strong>Interest Rate:</strong> 7% - 12% p.a.</p>
                <p><i className="fas fa-clock"></i> <strong>Disbursement:</strong> Instant to M-Pesa</p>
              </div>
              <div className="eligibility not-eligible">
                <i className="fas fa-times-circle"></i>
                <span>Requires Absa bank account</span>
              </div>
              <div className="loan-app-actions">
                <div className="loan-app-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                  <span style={{ marginLeft: "5px", color: "var(--gray)" }}>4.4</span>
                </div>
                <button className="btn btn-outline" onClick={() => applyForLoan('Timiza')}>Learn More</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-title">
            <h2>Why Check Your CRB Status?</h2>
            <p>Regularly monitoring your credit status helps you maintain financial health and access better credit opportunities.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h3>Monitor Your Credit</h3>
              <p>Regularly check your credit report to ensure accuracy and detect any unauthorized activities or errors.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3>Improve Loan Approval</h3>
              <p>A good credit score increases your chances of loan approval and helps you get better interest rates.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-file-certificate"></i>
              </div>
              <h3>Get Clearance Certificates</h3>
              <p>Obtain CRB clearance certificates required by employers, landlords, and financial institutions.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreditCheck;