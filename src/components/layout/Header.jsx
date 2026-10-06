import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import { DContext } from '../../context/DContext'
import { authStorageService } from '../../services/auth-storage.service'
import { SITE_CONFIG, USER_ROLES } from '../../config/siteConfig'
import { USE_DEMO_DATA } from '../../config/apiConfig'
import { resetDemoDb } from '../../demo/demo-db'
import { initials } from '../../helper/stringMethods'

const Header = () => {
  const { authState, authDispatch } = useContext(DContext);
  const user = authState?.user;
  const isProvider = authState?.user_role?.role_code === USER_ROLES.JOB_PROVIDER;

  const handleLogout = () => {
    authStorageService.clearAuthentication();
    authDispatch({ type: "LOGOUT" });
  }

  // Demo builds only: throw away all demo changes and start again from the seed data
  const handleResetDemo = async () => {
    const result = await withReactContent(Swal).fire({
      title: "Reset demo data?",
      text: "All jobs, applications, profile changes and new accounts created in this browser will be replaced by the original demo data. You will be logged out.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d93025",
      confirmButtonText: "Yes, reset it",
      cancelButtonText: "Cancel"
    });
    if (!result.isConfirmed) return;
    resetDemoDb();
    handleLogout();
    toast.success("Demo data has been reset.");
  }

  return (
    <header id="header" className="header fixed-top d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between">
        <Link to="/" className="logo d-flex align-items-center">
          <span className="logo-mark"><i className="bi bi-mortarboard-fill"></i></span>
          <span className="d-none d-lg-block">{SITE_CONFIG.brandName}</span>
        </Link>
        <i className="bi bi-list toggle-sidebar-btn"></i>
      </div>

      <nav className="header-nav ms-auto">
        <ul className="d-flex align-items-center">
          <li className="nav-item dropdown pe-3">
            <button type="button" className="nav-link nav-profile d-flex align-items-center pe-0 btn border-0 bg-transparent" data-bs-toggle="dropdown" aria-expanded="false">
              <span className="avatar">{initials(user?.name) || <i className="bi bi-person"></i>}</span>
              <span className="d-none d-md-block dropdown-toggle ps-2 text-truncate" style={{ maxWidth: 220 }}>{user?.name}</span>
            </button>

            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
              <li className="dropdown-header">
                <h6 className="text-truncate">{user?.name}</h6>
                <span className="text-muted">{authState?.user_role?.role_name}</span>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link className="dropdown-item d-flex align-items-center" to="/profile/view">
                  <i className={isProvider ? "bi bi-building" : "bi bi-person"}></i>
                  <span>{isProvider ? "Institution Profile" : "My Profile"}</span>
                </Link>
              </li>
              {USE_DEMO_DATA && (
                <>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button type="button" className="dropdown-item d-flex align-items-center" onClick={handleResetDemo}>
                      <i className="bi bi-arrow-counterclockwise"></i>
                      <span>Reset demo data</span>
                    </button>
                  </li>
                </>
              )}
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button type="button" className="dropdown-item d-flex align-items-center" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default Header
