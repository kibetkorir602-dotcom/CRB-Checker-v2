import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CreditCheckStatus = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [formData, setFormData] = useState(null);
  
  const resultsRef = useRef(null);

  useEffect(() => {
    // Check if payment was made
    const paymentStatus = localStorage.getItem('crbPaymentVerified');
    const storedData = localStorage.getItem('crbCheckData');
    
    if (paymentStatus === 'true' && storedData) {
      setPaymentVerified(true);
      setFormData(JSON.parse(storedData));
      generateResults(JSON.parse(storedData));
    } else {
      // If no payment, redirect to checker
      navigate("/credit-check-status");
    }
  }, [navigate]);

  const generateResults = (data) => {
    // Generate random results for demonstration
    const statusOptions = ['Good Standing', /*'Default Listed',*/ 'Watch List'];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // Format date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB');
    
    // Set CRB name
    let crbName = '';
    switch(data.crbOption) {
      case 'creditinfo': crbName = 'Creditinfo Kenya'; break;
      case 'metropol': crbName = 'Metropol Credit Reference Bureau'; break;
      case 'transunion': crbName = 'TransUnion Kenya'; break;
      default: crbName = 'Credit Reference Bureau';
    }
    
    // Set status and details based on random result
    let resultDetails = {
      name: data.fullName,
      id: data.idNumber,
      phone: data.phoneNumber,
      crb: crbName,
      date: formattedDate,
      status: randomStatus,
      statusClass: randomStatus === 'Good Standing' ? 'status-clear' : 
                   //randomStatus === 'Default Listed' ? 'status-flagged' : 
                   'status-warning',
      statusText: randomStatus === 'Good Standing' ? 'No negative listings - Eligible for credit' :
                  //randomStatus === 'Default Listed' ? 'Has defaulted on loan payments - Not eligible for new credit' :
                  'Some late payments - Limited credit options available'
    };
    
    if (randomStatus === 'Good Standing') {
      resultDetails.score = Math.floor(600 + Math.random() * 200) + '/900 (Good)';
      resultDetails.loans = Math.floor(1 + Math.random() * 3) + ' active loans (KSh ' + Math.floor(10000 + Math.random() * 150000) + ' total)';
      resultDetails.history = (85 + Math.floor(Math.random() * 15)) + '% on-time payments';
    }/* else if (randomStatus === 'Default Listed') {
      resultDetails.score = Math.floor(300 + Math.random() * 150) + '/900 (Poor)';
      resultDetails.loans = Math.floor(1 + Math.random() * 4) + ' loans (1 default)';
      resultDetails.history = (40 + Math.floor(Math.random() * 30)) + '% on-time payments';
    } */else {
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
  };

  const viewEligibleLoans = () => {
    navigate("/eligible-loans");
  };

  if (!paymentVerified) {
    return (
      <div className="container">
        <div className="payment-required">
          <h2>Payment Required</h2>
          <p>Please complete the payment to view your CRB status results.</p>
          <button className="btn btn-primary" onClick={() => navigate("/service-payment")}>
            Proceed to Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Results Section */}
      <section className="results-section" id="results" ref={resultsRef}>
        <div className="container">
          <div className="section-title">
            <h2>Your Credit Status Results</h2>
            <p>Based on the information provided, here is your credit status report.</p>
          </div>
          
          <div className="results-card" style={{ display: showResults ? 'block' : 'none' }}>
            {results && (
              <>
                <div className="results-header">
                  <div className="results-title-section">
                    <h3>CRB Credit Report</h3>
                    <p className="report-id">Report ID: CRB-{Math.floor(10000 + Math.random() * 90000)}</p>
                  </div>
                  <div className={`result-status ${results.statusClass}`}>
                    <i className={results.status === 'Good Standing' ? 'fas fa-check-circle' : 
                                 'fas fa-exclamation-triangle'}></i>
                    {results.status}
                  </div>
                </div>
                
                <div className="results-content">
                  <div className="personal-info">
                    <h4><i className="fas fa-user"></i> Personal Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{results.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">ID Number</span>
                        <span className="info-value">{results.id}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone Number</span>
                        <span className="info-value">{results.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">CRB Bureau</span>
                        <span className="info-value">{results.crb}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="credit-score-section">
                    <h4><i className="fas fa-chart-line"></i> Credit Score Analysis</h4>
                    <div className="score-display">
                      {/*<div className="score-circle">
                        <div className="score-value">{results.score.split('/')[0]}</div>
                        <div className="score-total">/900</div>
                      </div>*/}
                      <div className="score-details">
                        <div className="score-grade">{results.score.includes('Good') ? 'GOOD' : 'FAIR'/*results.score.includes('Fair') ? 'FAIR' : 'POOR'*/}</div>
                        <p className="score-text">{results.statusText}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/*<div className="loan-details">
                    <h4><i className="fas fa-file-invoice-dollar"></i> Loan Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <div className="detail-icon">
                          <i className="fas fa-money-bill-wave"></i>
                        </div>
                        <div>
                          <div className="detail-label">Active Loans</div>
                          <div className="detail-value">{results.loans}</div>
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-icon">
                          <i className="fas fa-history"></i>
                        </div>
                        <div>
                          <div className="detail-label">Payment History</div>
                          <div className="detail-value">{results.history}</div>
                        </div>
                      </div>
                    </div>
                  </div>*/}
                  
                  <div className="results-footer">
                    <div className="action-buttons">
                      <button className="btn btn-primary" onClick={viewEligibleLoans}>
                        <i className="fas fa-hand-holding-usd"></i> View Eligible Loans
                      </button>
                      <button className="btn btn-secondary" onClick={() => window.print()}>
                        <i className="fas fa-print"></i> Print Report
                      </button>
                    </div>
                    <div className="verification-date">
                      <i className="far fa-calendar-alt"></i> Report generated on: <span>{results.date}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreditCheckStatus;