import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import SideBar from '../components/layout/SideBar'
import Footer from '../components/layout/Footer'

const UserLayout = () => {
  return (
    <>
      <Header />
      <SideBar />
      <div className="sidebar-backdrop"></div>
      <main id="main" className="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default UserLayout
