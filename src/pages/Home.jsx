import React from "react";
import { useNavigate } from "react-router-dom";
import Banner from '../assets/banner.png'

function Home() {
  const navigator = useNavigate();

    // Navigation functions
  const scrollToChecker = () => {
    checkerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLoanApps = () => {
    loanAppsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h2>Check Your Credit Status with Kenya's CRB</h2>
              <p>Check your credit score, get clearance report, and find loan options tailored to your financial profile.</p>
              <button className="btn btn-primary" onClick={() => {
                navigator("/crb-check")
              }}>Check Credit Status <i className="fas fa-arrow-right"></i></button>
            </div>
            <div className="hero-image">
              <img src={Banner/*https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80*/} alt="Financial Services in Kenya" />
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
                <i className="fas fa-certificate"></i>
              </div>
              <h3>Get Clearance Certificates</h3>
              <p>Obtain CRB clearance certificates required by employers, landlords, and financial institutions.</p>
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
              {/*<p><strong>USSD Code:</strong> *433#</p>*/}
            </div>
            
            <div className="crb-card">
              <div className="crb-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Metropol CRB</h3>
              <p>Provides credit reports, scores and certificates. Popular for SME and individual credit assessments.</p>
              {/*<p><strong>USSD Code:</strong> *433#</p>*/}
            </div>
            
            <div className="crb-card">
              <div className="crb-icon">
                <i className="fas fa-globe"></i>
              </div>
              <h3>TransUnion Kenya</h3>
              <p>Global credit bureau with local presence in Kenya, offering credit information and analytics services.</p>
              {/*<p><strong>USSD Code:</strong> *433#</p>*/}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
