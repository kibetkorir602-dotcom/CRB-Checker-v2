import React from "react";

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <h3>Mwananchi Credit</h3>
            <p>Your trusted partner for logbook loans in Kenya. Fast, transparent, and affordable financing solutions using your vehicle as collateral.</p>
            <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
              <a href="#" style={{ color: "white", fontSize: "20px" }}><i className="fab fa-facebook"></i></a>
              <a href="#" style={{ color: "white", fontSize: "20px" }}><i className="fab fa-twitter"></i></a>
              <a href="#" style={{ color: "white", fontSize: "20px" }}><i className="fab fa-instagram"></i></a>
              <a href="#" style={{ color: "white", fontSize: "20px" }}><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
          
          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">Logbook Loans</a></li>
              <li><a href="#">Personal Loans</a></li>
              <li><a href="#">Business Loans</a></li>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Loan Products</h3>
            <ul>
              <li><a href="#">Car Logbook Loans</a></li>
              <li><a href="#">Motorcycle Logbook Loans</a></li>
              <li><a href="#">Truck Logbook Loans</a></li>
              <li><a href="#">Emergency Loans</a></li>
              <li><a href="#">Business Expansion Loans</a></li>
              <li><a href="#">School Fees Loans</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Contact Us</h3>
            <div className="contact-info">
              <i className="fas fa-map-marker-alt"></i>
              <div>
                <div>Nairobi Headquarters</div>
                <div style={{ fontSize: "14px", color: "#bdc3c7" }}>Pioneer House, Kimathi Street</div>
              </div>
            </div>
            <div className="contact-info">
              <i className="fas fa-phone-alt"></i>
              <div>
                <div>0709 607 000</div>
                <div style={{ fontSize: "14px", color: "#bdc3c7" }}>Mon-Sat, 8AM-6PM</div>
              </div>
            </div>
            <div className="contact-info">
              <i className="fas fa-envelope"></i>
              <div>
                <div>info@mwananchicredit.co.ke</div>
                <div style={{ fontSize: "14px", color: "#bdc3c7" }}>Email us anytime</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2023 Mwananchi Credit Limited. All rights reserved. | Licensed by Central Bank of Kenya</p>
          <p style={{ marginTop: "10px", fontSize: "12px" }}>Credit services are subject to terms and conditions. Borrow responsibly.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;