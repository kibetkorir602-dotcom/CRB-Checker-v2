import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

function BannerAd() {
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    const adShownInSession = sessionStorage.getItem("adShownInSession");
    const adClosed = sessionStorage.getItem("adClosed");
    const lastAdShownTime = localStorage.getItem("lastAdShownTime");
    const currentTime = Date.now();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    
    let shouldShowBasedOnTime = true;
    if (lastAdShownTime) {
      const timeSinceLastAd = currentTime - parseInt(lastAdShownTime);
      shouldShowBasedOnTime = timeSinceLastAd > twoHoursInMs;
    }
    
    if (!adShownInSession && !adClosed && shouldShowBasedOnTime) {
      setShowAd(true);
      sessionStorage.setItem("adShownInSession", "true");
      localStorage.setItem("lastAdShownTime", currentTime.toString());
      
      const autoCloseTimer = setTimeout(() => {
        handleCloseAd();
      }, 15000);
      
      return () => clearTimeout(autoCloseTimer);
    }
  }, []);

  const handleCloseAd = () => {
    setShowAd(false);
    sessionStorage.setItem("adClosed", "true");
    localStorage.setItem("lastAdShownTime", Date.now().toString());
  };

  if (!showAd) return null;

  return (
    <div className="banner-ad ad-format">
      <div className="ad-close" onClick={handleCloseAd}>✕</div>
      <div className="banner-content">
        <h3>Get Instant Loan To Mpesa</h3>
        <p>Special Offer Just For You.</p>
        <NavLink to="https://faidafunds.onrender.com/" className="ad-btn" target="_blank">
          Apply Now
        </NavLink>
      </div>
      <div className="ad-footer">
        <span>Ad • Faida Funds</span>
        <span>Sponsored</span>
      </div>
    </div>
  );
}

export default BannerAd;