import React, {useRef } from "react";
import { useNavigate } from "react-router-dom";

const EligibleLoans = () => {
  const navigate = useNavigate();
  const loanAppsRef = useRef(null);

  // Apply for loan function
  const applyForLoan = (loanApp) => {
    navigate('/apply-loan');
  };

  const loanApps = [
    {
      id: 1,
      name: "Tala",
      description: "Fast, unsecured loans with growing limits",
      icon: "fas fa-bolt",
      details: [
        { icon: "fas fa-money-bill-wave", label: "Loan Limit:", value: "KSh 500 - KSh 50,000" },
        { icon: "fas fa-percentage", label: "Interest Rate:", value: "15% - 30% p.a." },
        { icon: "fas fa-clock", label: "Disbursement:", value: "Within minutes" }
      ],
      eligible: true,
      eligibilityText: "You are eligible for this loan app"
    },
    {
      id: 2,
      name: "Branch",
      description: "Personal loans through simple, paperless process",
      icon: "fas fa-code-branch",
      details: [
        { icon: "fas fa-money-bill-wave", label: "Loan Limit:", value: "KSh 1,000 - KSh 70,000" },
        { icon: "fas fa-percentage", label: "Interest Rate:", value: "14% - 28% p.a." },
        { icon: "fas fa-clock", label: "Disbursement:", value: "Instant to M-Pesa" }
      ],
      eligible: true,
      eligibilityText: "You are eligible for this loan app"
    },
    {
      id: 3,
      name: "M-Pesa",
      description: "Mobile money platform with lending services",
      icon: "fas fa-sim-card",
      details: [
        { icon: "fas fa-money-bill-wave", label: "Loan Limit:", value: "KSh 100 - KSh 150,000" },
        { icon: "fas fa-percentage", label: "Interest Rate:", value: "7.5% - 10% p.a." },
        { icon: "fas fa-clock", label: "Disbursement:", value: "Instant to M-Pesa" }
      ],
      eligible: true,
      eligibilityText: "You are eligible for this loan app"
    },
    {
      id: 4,
      name: "KCB Mobile",
      description: "Mobile banking app with integrated loan services",
      icon: "fas fa-university",
      details: [
        { icon: "fas fa-money-bill-wave", label: "Loan Limit:", value: "KSh 1,000 - KSh 1,000,000" },
        { icon: "fas fa-percentage", label: "Interest Rate:", value: "8% - 15% p.a." },
        { icon: "fas fa-clock", label: "Disbursement:", value: "Within 24 hours" }
      ],
      eligible: false,
      eligibilityText: "Requires KCB bank account"
    },
    {
      id: 5,
      name: "Zenka",
      description: "Flexible personal loans with quick disbursement",
      icon: "fas fa-wind",
      details: [
        { icon: "fas fa-money-bill-wave", label: "Loan Limit:", value: "KSh 500 - KSh 30,000" },
        { icon: "fas fa-percentage", label: "Interest Rate:", value: "9% - 30% p.a." },
        { icon: "fas fa-clock", label: "Disbursement:", value: "Within 5 minutes" }
      ],
      eligible: true,
      eligibilityText: "You are eligible for this loan app"
    },
    {
      id: 6,
      name: "Timiza",
      description: "Absa Bank mobile loan product",
      icon: "fas fa-hand-holding-usd",
      details: [
        { icon: "fas fa-money-bill-wave", label: "Loan Limit:", value: "KSh 500 - KSh 300,000" },
        { icon: "fas fa-percentage", label: "Interest Rate:", value: "7% - 12% p.a." },
        { icon: "fas fa-clock", label: "Disbursement:", value: "Instant to M-Pesa" }
      ],
      eligible: false,
      eligibilityText: "Requires Absa bank account"
    }
  ];

  return (
    <div>
      {/* Loan Apps Section */}
      <section className="loan-apps-section" id="loan-apps" ref={loanAppsRef}>
        <div className="container">
          <div className="section-title">
            <h2>Eligible Loans Based on your credit  status</h2>
            <p>Apply with our CRB Checker to get approved today.</p>
          </div>
          
          <div className="loan-apps-grid">
            {loanApps.map((loanApp) => (
              <div className="loan-app-card" key={loanApp.id}>
                <div className="loan-app-header">
                  <div className="loan-app-icon">
                    <i className={loanApp.icon}></i>
                  </div>
                  <div className="loan-app-info">
                    <h3>{loanApp.name}</h3>
                    <p>{loanApp.description}</p>
                  </div>
                </div>
                <div className="loan-app-details">
                  {loanApp.details.map((detail, index) => (
                    <p key={index}>
                      <i className={detail.icon}></i> <strong>{detail.label}</strong> {detail.value}
                    </p>
                  ))}
                </div>
                <div className={`eligibility ${loanApp.eligible ? 'eligible' : 'not-eligible'}`}>
                  <i className={loanApp.eligible ? 'fas fa-check-circle' : 'fas fa-times-circle'}></i>
                  <span>{loanApp.eligibilityText}</span>
                </div>
                <div className="loan-app-actions">
                  <button 
                    className={`btn ${loanApp.eligible ? 'btn-primary' : 'btn-outline'}`} 
                    onClick={() => applyForLoan(loanApp.name)}
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EligibleLoans;