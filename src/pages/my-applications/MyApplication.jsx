import React from 'react'
import { useParams } from 'react-router-dom'
import MyApplicationList from '../../components/my-applications/MyApplicationList'
import { NoAccessRedirect, useModuleAccess } from '../../helper/access'

const METHODS = ["list"];

const MyApplication = () => {
    let { method } = useParams();
    const hasAccess = useModuleAccess("my-applications");

    if (!hasAccess || !METHODS.includes(method)) return <NoAccessRedirect />;

    return (
        <>
            {method === "list" && <MyApplicationList />}
        </>
    )
}

export default MyApplication
