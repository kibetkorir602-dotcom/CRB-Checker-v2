import { NavLink } from 'react-router-dom';

function Guide() {
  // Loan apps data array
  const loanApps = [
    {
      id: 1,
      name: "CRB Checker Loans",
      description: "With CRB Checker Loans, you can receive cash support from Ksh 1,000 to Ksh 50,000 for a period of 1 to 30 days. Quick approval process with minimal requirements for quick loans in Kenya.",
      amount: "Ksh 1,000 to Ksh 50,000"
    },
    {
      id: 2,
      name: "Branch",
      description: "This financial institution grants loans starting at Ksh 500 through Ksh 70,000 that clients can adjust according to their payment schedules. Their mobile platform makes creditworthiness assessments through non-traditional data sources for emergency loans in Kenya.",
      amount: "Ksh 500 through Ksh 70,000"
    },
    {
      id: 3,
      name: "Tala",
      description: "With Tala, you can receive cash support from Ksh 1,000 to Ksh 50,000 for a period of 1 to 30 days. Quick approval process with minimal requirements for quick loans in Kenya.",
      amount: "Ksh 1,000 to Ksh 50,000"
    },
    {
      id: 4,
      name: "O-Kash",
      description: "Users can obtain a Ksh 50,000 instant loan through this service which completes processing within 5 minutes or less. Perfect for situations when you need business loans in Kenya quickly.",
      amount: "Ksh 50,000"
    },
    {
      id: 5,
      name: "Zenka",
      description: "Potential clients receive funding from Ksh 30000 at zero percent interest, marking their first time using the service. The company automatically increases borrowing capacity for existing customers who show good payment habits, similar to how logbook loans work.",
      amount: "Ksh 30000"
    },
    {
      id: 6,
      name: "Okolea",
      description: "Users accessing loans between Ksh 1,500 to Ksh 50,000 through this platform can have between 91 and 180 days to make their repayments, making it one of the best loan apps in Kenya without CRB.",
      amount: "Ksh 1,500 to Ksh 50,000"
    },
    {
      id: 7,
      name: "Ferratum",
      description: "The lending service gives users loans starting from Ksh 500 up to Ksh 70,000 while maintaining transparent financial terms and competitive short-term borrowing rates.",
      amount: "Ksh 500 up to Ksh 70,000"
    },
    {
      id: 8,
      name: "Timiza",
      description: "The lending application from Equity Bank lets users receive instant M-Pesa account loans between Ksh 100 and Ksh 50,000. Also, it offers additional banking services similar to trade finance services in Kenya.",
      amount: "Ksh 100 and Ksh 50,000"
    },
    {
      id: 9,
      name: "Kashway",
      description: "Users can access straightforward online borrowing services from Kashway to obtain Ksh 50,000 in loans with 7% starting interest.",
      amount: "Ksh 50,000"
    },
    {
      id: 10,
      name: "Zash Loan",
      description: "Customers can receive instant loans starting at Ksh 500 and extending up to Ksh 30,000 through this service. The loans a first-time borrower receives start small but expand when loan payments show responsible use of funds.",
      amount: "Ksh 500 to Ksh 30,000"
    },
    /*{
      id: 11,
      name: "PesaKit",
      description: "Instant loans between Ksh 500 and Ksh 10,000 with repayment periods of 7 to 30 days. Simple requirements and fast processing for quick loans in Kenya.",
      amount: "Ksh 500 and Ksh 10,000"
    }*/
    // Add more apps here as needed
  ];

  // Comments data array
  const comments = [
    {
      id: 1,
      avatar: "H",
      name: "Halima atabo",
      time: "4 months ago",
      text: "Need loan for the hospital"
    },
    {
      id: 2,
      avatar: "H",
      name: "Halima atabo",
      time: "4 months ago",
      text: "Need loan urgently"
    },
    {
      id: 3,
      avatar: "C",
      name: "Cyrus Kimemia",
      time: "4 months ago",
      text: "Am down need a booster for my business"
    },
    {
      id: 4,
      avatar: "B",
      name: "Benadine tarus",
      time: "4 months ago",
      text: "I will appreciate when I would be given a loan"
    },
    {
      id: 5,
      avatar: "L",
      name: "Lilian Adhiambo",
      time: "5 months ago",
      text: "I like your services"
    }
  ];

  // Popular loan types data array
  const loanTypes = [
    { id: 1, name: "Emergency Loans Kenya" },
    { id: 2, name: "Personal Loans in Kenya" },
    { id: 3, name: "Business Loans in Kenya" },
    { id: 4, name: "Logbook Loans Kenya" },
    { id: 5, name: "Salary Check Off Loans" },
    { id: 6, name: "Import Financing Kenya" },
    { id: 7, name: "Trade Finance Services" },
    { id: 8, name: "Car Financing Kenya" }
  ];

  // Recent posts data array
  const recentPosts = [
    { id: 1, name: "How to Clear CRB Listing in Kenya" },
    { id: 2, name: "Top 10 Loan Apps with Lowest Interest" },
    { id: 3, name: "M-Pesa Loan: Complete Guide 2023" },
    { id: 4, name: "How to Improve Your Credit Score" },
    { id: 5, name: "Avoiding Loan Scams in Kenya" }
  ];

    // Create a helper function to render loan description with highlighted amount
  const renderLoanDescription = (description, amount) => {
    // Split the description by the amount and rejoin with JSX element
    const parts = description.split(amount);
    
    return (
      <>
        {parts[0]}
        <span className="loan-amount">{amount}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div>
        <div className="main-content">
            { /* Blog Post */ }
            <article className="blog-post">
                <div className="blog-header">
                    <h1 className="blog-title">No CRB? No Problem! Best Apps for Quick Loans in Kenya</h1>
                    <div className="blog-meta">
                        <span><i className="far fa-calendar" /> Posted: 6 months Ago</span>
                        <span><i className="far fa-clock" /> 8 min read</span>
                        <span><i className="far fa-comments" /> 19 comments</span>
                    </div>
                    <div className="pattern-dots" />
                </div>

                <div className="blog-content">
                    <p>Bad credit score? Blacklisted by the CRB? Don't worry! Digital lending operations in Kenya have developed solutions for all types of customers. Loan app operators have learned that it is wrong to base personal loans in Kenya decisions on credit history alone. Your complete guide introduces you to the list of the best loan apps in Kenya without CRB checks during an emergency.</p>
                    
                    <div className="highlight-box">
                        <p>These loan apps use alternative data sources like mobile money transaction history, social media activity, and behavioral patterns to assess creditworthiness instead of relying solely on traditional CRB reports.</p>
                    </div>

                    <h2>Top 35 Online Loans in Kenya Without CRB Checks</h2>
                    
                    <div className="loan-apps-list">
                        {/* Map through loan apps data */}
                        {loanApps.map((app) => (
                          <div key={app.id} className="loan-app-item">
                              <div className="loan-app-number">{app.id}</div>
                              <div className="loan-app-details">
                                  <h3>{app.name}</h3>
                                  <p>{renderLoanDescription(app.description, app.amount)}</p>
                                  {
                                    app.id === 1 && <NavLink to="/loan" className="cta-button" style={{
                                      border: "1px solid green",
                                      padding: "10px"
                                    }}>Apply Now</NavLink>
                                  }
                              </div>
                          </div>
                        ))}
                    </div>

                    <div className="highlight-box">
                        <p>These apps represent just the first 10 options from our comprehensive list of 35 loan apps that don't require CRB checks. Each offers unique features tailored to different borrowing needs.</p>
                    </div>

                    <h3>Financial Freedom at Your Fingertips</h3>
                    <p>Nowadays people have broken free from the constraint of CRB listings on their financial opportunities. These best loan apps in Kenya without CRB bring accessible monetary support to users during bank operating hours. Borrowing money responsibly together with on-time payment will help you develop good credit standing with lenders.</p>

                    {/*<div className="also-read">
                        <h3>Also Read</h3>
                        <a href="#">Loan Website vs App: Which Is Better for Quick Approval?</a>
                        <p>Compare the pros and cons of using loan websites versus mobile applications for faster loan processing and approval in Kenya.</p>
                    </div>*/}

                    <div className="crbloans-section">
                        <h3>Need a More Substantial Loan with Flexible Terms?</h3>
                        <p>CRB Credit stands out as a platform suitable for customers wanting large loans under advantageous conditions. CRB Credit provides various financial solutions at competitive prices along with individualized attention and adaptable payment schedules that adapt to your financial standing. They offer specialized import financing in Kenya and other services.</p>
                        <p>Apply for CRB Credit Loans today anf get approved within 10 minutes.</p>
                        <NavLink to="/loan" className="contact-button">Apply Now</NavLink>
                    </div>

                    {/*<div className="disclaimer">
                        <h4><i className="fas fa-exclamation-triangle" /> Disclaimer</h4>
                        <p>The company reserves the right to modify interest rates and loan agreements at any time.    </p>
                    </div>*/}

                    <div className="comments-section">
                        <h3>19 Comments</h3>
                        
                        {/* Map through comments data */}
                        {comments.map((comment) => (
                          <div key={comment.id} className="comment">
                              <div className="comment-avatar">{comment.avatar}</div>
                              <div className="comment-content">
                                  <h4>{comment.name}</h4>
                                  <div className="comment-meta">{comment.time}</div>
                                  <p className="comment-text">{comment.text}</p>
                              </div>
                          </div>
                        ))}
                        
                        {/*<div className="comments-closed">
                            <p><i className="fas fa-lock" /> Comments are closed.</p>
                        </div>*/}
                    </div>
                </div>
            </article>

            { /* Sidebar */ }
            <aside className="sidebar">
                {/*<div className="sidebar-widget">
                    <h3>Popular Loan Types</h3>
                    <ul className="popular-loans">
                        {
                          // Map through loan types data 
                        }
                        {loanTypes.map((loanType) => (
                          <li key={loanType.id}>
                            <NavLink tof="/loan"><i className="fas fa-arrow-right" /> {loanType.name}</NavLink>
                          </li>
                        ))}
                    </ul>
                </div>*/}

                <div className="sidebar-widget cta-widget">
                    <h3>Need a Loan Now?</h3>
                    <p>Check your eligibility for instant loans without CRB checks.</p>
                    <NavLink to="/crb-check" className="cta-button">Check Eligibility</NavLink>
                </div>

                {/*<div className="sidebar-widget">
                    <h3>Recent Posts</h3>
                    <ul className="popular-loans">
                        {recentPosts.map((post) => (
                          <li key={post.id}>
                            <a href="#"><i className="far fa-file-alt" /> {post.name}</a>
                          </li>
                        ))}
                    </ul>
                </div>*/}
            </aside>
        </div>
    </div>
  )
}

export default Guide