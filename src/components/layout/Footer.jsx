import React from 'react'
import { SITE_CONFIG } from '../../config/siteConfig'

const Footer = () => {
  return (
    <>
      <footer id="footer" className="footer">
        <div className="copyright">
          &copy; {new Date().getFullYear()} <strong><span>{SITE_CONFIG.copyrightHolder}</span></strong>. All Rights Reserved
        </div>
      </footer>
      <button type="button" className="back-to-top d-flex align-items-center justify-content-center border-0">
        <i className="bi bi-arrow-up-short"></i>
      </button>
    </>
  )
}

export default Footer
