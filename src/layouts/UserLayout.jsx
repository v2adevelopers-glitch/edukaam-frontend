import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/layout/Header'
import SideBar from '../components/layout/SideBar'
import Footer from '../components/layout/Footer'

const UserLayout = () => {
  const location = useLocation();

  // a new page starts at the top instead of keeping the previous page's scroll position
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <>
      <Header />
      <SideBar />
      <div className="sidebar-backdrop"></div>
      <main id="main" className="main">
        {/* keyed by path so every page plays the enter transition */}
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default UserLayout
