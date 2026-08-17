import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

function BannerAd() {
  const [showAd, setShowAd] = useState(false);

useEffect(() => {
  // Check if user has seen the ad in this session
  const adShownInSession = sessionStorage.getItem("adShownInSession");
  
  // Check if user has closed the ad permanently (for current session)
  const adClosed = sessionStorage.getItem("adClosed");
  
  // Check when the ad was last shown
  const lastAdShownTime = localStorage.getItem("lastAdShownTime");
  const currentTime = Date.now();
  const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  
  // Determine if enough time has passed since last ad show
  let shouldShowBasedOnTime = true;
  
  if (lastAdShownTime) {
    const timeSinceLastAd = currentTime - parseInt(lastAdShownTime);
    shouldShowBasedOnTime = timeSinceLastAd > twoHoursInMs;
  }
  
  // Only show ad if conditions are met
  if (!adShownInSession && !adClosed && shouldShowBasedOnTime) {
    setShowAd(true);
    // Mark that ad has been shown in this session
    sessionStorage.setItem("adShownInSession", "true");
    // Store the current time as the last time ad was shown
    localStorage.setItem("lastAdShownTime", currentTime.toString());
    
    // AUTO-CLOSE AFTER 2 MINUTES
    const autoCloseTimer = setTimeout(() => {
      handleCloseAd();
    }, 15000); // 2 minutes in milliseconds
    
    // Clean up timer if component unmounts or ad is manually closed
    return () => clearTimeout(autoCloseTimer);
  }
}, []); // Empty dependency array means this runs once when component mounts

  // For localStorage approach (if you really need localStorage)
  /*useEffect(() => {
    const lastAdShown = localStorage.getItem("lastAdShown");
    const lastAdClosed = localStorage.getItem("lastAdClosed");
    const currentSession = sessionStorage.getItem("currentSession");
    
    // NEW: Check 2-hour rule
    const lastAdShownTime = localStorage.getItem("lastAdShownTime");
    const currentTime = Date.now();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    
    let shouldShowBasedOnTime = true;
    if (lastAdShownTime) {
      const timeSinceLastAd = currentTime - parseInt(lastAdShownTime);
      shouldShowBasedOnTime = timeSinceLastAd > twoHoursInMs;
    }

    // Check if this is a new browser session
    if (!currentSession) {
      // Clear localStorage flags for new session
      localStorage.removeItem("lastAdShown");
      localStorage.removeItem("lastAdClosed");
      sessionStorage.setItem("currentSession", "true");
    }

    if (!lastAdShown && !lastAdClosed && shouldShowBasedOnTime) {
      setShowAd(true);
      localStorage.setItem("lastAdShown", Date.now().toString());
      localStorage.setItem("lastAdShownTime", Date.now().toString());
    }
  }, []);*/

  const handleCloseAd = () => {
    setShowAd(false);
    // Mark that user closed the ad (for this session only)
    sessionStorage.setItem("adClosed", "true");
    // OPTIONAL: When user closes, also update the last shown time 
    // so it won't reappear for another 2 hours even after browser restart
    localStorage.setItem("lastAdShownTime", Date.now().toString());
  };

// Page load/visibility events
useEffect(() => {
  // When page is fully loaded
  window.onload = () => {
    console.log('Page loaded');
    setTimeout(() => handleCloseAd(), 15000);
  };

  // When page is shown (including from back/forward cache)
  window.onpageshow = (event) => {
    console.log('Page shown', event.persisted);
    if (event.persisted) {
      // Page was restored from cache
      setTimeout(() => handleCloseAd(), 15000);
    }
  };

  // When page is hidden (user navigates away)
  window.onpagehide = () => {
    console.log('Page hidden');
  };

  // Cleanup
  return () => {
    window.onload = null;
    window.onpageshow = null;
    window.onpagehide = null;
  };
}, []);

  // Don't render anything if ad shouldn't show
  if (!showAd) return null;

  return (
    <div className="banner-ad ad-format">
      <div className="ad-close" onClick={handleCloseAd}>
        x
      </div>
      <div className="banner-content">
        <h3>Get Instant Loan To Mpesa</h3>
        <p>Special Offer Just For You.</p>
        <NavLink
          to="https://faidafunds.onrender.com/"
          className="ad-btn"
          target="_blank"
        >
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