import React from 'react'
import { useLocation, useParams } from 'react-router-dom'
import ApplicationList from '../../components/applications/ApplicationList'
import { NoAccessRedirect, useModuleAccess } from '../../helper/access'

// Applications are created by seekers, so the provider side has a list only (no add/edit page)
const METHODS = ["list"];

const Application = () => {
    let { method } = useParams();
    const location = useLocation();
    const hasAccess = useModuleAccess("applications");

    if (!hasAccess || !METHODS.includes(method)) return <NoAccessRedirect />;

    return (
        <>
            {/* keyed by location so a new { jobId } in router state re-applies the job filter */}
            {method === "list" && <ApplicationList key={location.key} />}
        </>
    )
}

export default Application
