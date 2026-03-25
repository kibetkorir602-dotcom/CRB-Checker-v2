import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreditCheck = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    emailAddress: "",
    crbOption: ""
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const performCRBCheck = () => {
    if (!formData.fullName || !formData.idNumber || !formData.phoneNumber || !formData.emailAddress || !formData.crbOption) {
      alert('Please fill in all required fields before checking your credit status.');
      return;
    }

    localStorage.setItem('crbCheckData', JSON.stringify(formData));
    navigate("/service-payment");
  };

  return (
    <section className="checker-section">
      <div className="container">
        <div className="section-title">
          <h2>Check Your CRB Status</h2>
          <p>Enter your details to check your credit status with Kenya's Credit Reference Bureaus.</p>
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
                type="tel" 
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
              <i className="fas fa-lock"></i> Your information is secure and encrypted.
            </div>
            <button className="btn btn-primary" onClick={performCRBCheck}>
              Check Credit Status <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreditCheck;