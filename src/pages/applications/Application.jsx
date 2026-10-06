import React from 'react'
import { useParams } from 'react-router-dom'
import ApplicationList from '../../components/applications/ApplicationList'
import { NoAccessRedirect, useModuleAccess } from '../../helper/access'

// Applications are created by seekers, so the provider side has a list only (no add/edit page)
const METHODS = ["list"];

const Application = () => {
    let { method } = useParams();
    const hasAccess = useModuleAccess("applications");

    if (!hasAccess || !METHODS.includes(method)) return <NoAccessRedirect />;

    return (
        <>
            {method === "list" && <ApplicationList />}
        </>
    )
}

export default Application
