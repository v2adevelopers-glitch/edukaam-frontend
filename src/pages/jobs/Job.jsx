import React from 'react'
import { useParams } from 'react-router-dom'
import JobList from '../../components/jobs/JobList'
import AddJob from '../../components/jobs/AddJob'
import { NoAccessRedirect, useModuleAccess } from '../../helper/access'

const METHODS = ["list", "add"];

const Job = () => {
    let { method } = useParams();
    const hasAccess = useModuleAccess("jobs");

    if (!hasAccess || !METHODS.includes(method)) return <NoAccessRedirect />;

    return (
        <>
            {method === "add" && <AddJob />}
            {method === "list" && <JobList />}
        </>
    )
}

export default Job
