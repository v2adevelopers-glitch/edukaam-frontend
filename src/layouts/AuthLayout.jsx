import React from 'react'
import { Link } from 'react-router-dom'
import { SITE_CONFIG } from '../config/siteConfig'

// Centered card layout for the logged-out pages (login, signup)
const AuthLayout = ({ children, wide = false }) => {
  return (
    <main style={{ background: "#f6f9ff", minHeight: "100vh" }}>
      <div className="container">
        <section className="min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
          <div className="row justify-content-center w-100">
            <div className={wide ? "col-12 col-md-10 col-lg-8 col-xl-7" : "col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4"}>
              <div className="d-flex justify-content-center py-3">
                <Link to="/login" className="logo d-flex align-items-center w-auto">
                  <span className="logo-mark"><i className="bi bi-mortarboard-fill"></i></span>
                  <span>{SITE_CONFIG.brandName}</span>
                </Link>
              </div>
              <div className="auth-card">{children}</div>
              <div className="text-center mt-3" style={{ fontSize: 12, color: "#8a9ab5" }}>
                {SITE_CONFIG.tagline}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
