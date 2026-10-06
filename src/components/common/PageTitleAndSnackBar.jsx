import React from 'react'
import { Link } from 'react-router-dom'

// Title + breadcrumb for simple pages that have no header of their own (e.g. profile view).
// crumbs: [{ label, to? }] — the last crumb is the current page
const PageTitleAndSnackBar = ({ title, crumbs = [], children }) => {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
      <div>
        <h4 className="m-0 fw-bold" style={{ color: "#1a202c", fontSize: 20 }}>{title}</h4>
        <nav className="d-flex align-items-center gap-1 mt-1 flex-wrap" style={{ fontSize: 12, color: "#8a9ab5" }}>
          <Link to="/" style={{ color: "#8a9ab5" }}><i className="bi bi-house-door"></i></Link>
          {crumbs.map((c, i) => (
            <React.Fragment key={c.label}>
              <i className="bi bi-chevron-right" style={{ fontSize: 9 }}></i>
              {i === crumbs.length - 1
                ? <span className="fw-semibold" style={{ color: "#4a5568" }}>{c.label}</span>
                : c.to ? <Link to={c.to} style={{ color: "#8a9ab5" }}>{c.label}</Link> : <span>{c.label}</span>}
            </React.Fragment>
          ))}
        </nav>
      </div>
      {children && <div className="d-flex align-items-center gap-2">{children}</div>}
    </div>
  )
}

export default PageTitleAndSnackBar
