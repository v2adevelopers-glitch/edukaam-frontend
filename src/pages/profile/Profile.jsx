import React, { useContext } from 'react'
import { useParams } from 'react-router-dom'
import { DContext } from '../../context/DContext'
import { USER_ROLES } from '../../config/siteConfig'
import ProviderProfile from '../../components/profile/ProviderProfile'
import SeekerProfile from '../../components/profile/SeekerProfile'
import { NoAccessRedirect, useModuleAccess } from '../../helper/access'

// Single-record module: "view" shows the profile card, "edit" the form. The role picks which profile.
const METHODS = ["view", "edit"];

const Profile = () => {
    let { method } = useParams();
    const { authState } = useContext(DContext);
    const hasAccess = useModuleAccess("profile");
    const roleCode = authState?.user_role?.role_code;

    if (!hasAccess || !METHODS.includes(method)) return <NoAccessRedirect />;

    return (
        <>
            {roleCode === USER_ROLES.JOB_PROVIDER && <ProviderProfile mode={method} />}
            {roleCode === USER_ROLES.JOB_SEEKER && <SeekerProfile mode={method} />}
        </>
    )
}

export default Profile
