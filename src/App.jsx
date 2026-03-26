import { NavLink, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Home from './pages/Home'
import CreditCheck from './pages/CreditCheck'
import Guide from './pages/Guide'
import ServicePayment from './pages/ServicePayment'
import CreditCheckStatus from './pages/CreditCheckStatus'
import EligibleLoans from './pages/EligibleLoans'
import LoanApplicationHashback from './pages/LoanApplicationHashback'
import LoanEligibility from './pages/LoanEligibility'
import BannerAd from './BannerAd'

function App() {
  return (
    <Router>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <i className="fas fa-wallet"></i>
            <h1>CRB <span>Checker</span></h1>
            <div className="kenya-flag" title="Kenya"></div>
          </div>
        </div>
      </header>
      
      <BannerAd />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="crb-check" element={<CreditCheck />} />
        <Route path="loan" element={<LoanEligibility />} />
        <Route path="guide" element={<Guide />} />
        <Route path="service-payment" element={<ServicePayment />} />
        <Route path="credit-check-status" element={<CreditCheckStatus />} />
        <Route path="eligible-loans" element={<EligibleLoans />} />
        <Route path="apply-loan" element={<LoanApplicationHashback />} />
      </Routes>
      
      <div className="bottom-nav">
        <NavLink to="/" className="nav-item">
          <i className="fas fa-home" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/crb-check" className="nav-item">
          <i className="fas fa-hand-holding-usd" />
          <span>Check CRB</span>
        </NavLink>
        <NavLink to="/loan" className="nav-item">
          <i className="fas fa-money-check-alt" />
          <span>Loan</span>
        </NavLink>
        <NavLink to="/guide" className="nav-item">
          <i className="fas fa-gem" />
          <span>Guide</span>
        </NavLink>
      </div>
    </Router>
  )
}

export default App
