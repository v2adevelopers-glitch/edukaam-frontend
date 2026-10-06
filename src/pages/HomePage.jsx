import React, { useContext } from 'react'
import { DContext } from '../context/DContext'
import { USER_ROLES } from '../config/siteConfig'
import ProviderDashboard from '../components/dashboard/ProviderDashboard'
import SeekerDashboard from '../components/dashboard/SeekerDashboard'

const HomePage = () => {
  const { authState } = useContext(DContext);
  const roleCode = authState?.user_role?.role_code;

  return (
    <>
      {roleCode === USER_ROLES.JOB_PROVIDER && <ProviderDashboard />}
      {roleCode === USER_ROLES.JOB_SEEKER && <SeekerDashboard />}
    </>
  )
}

export default HomePage
