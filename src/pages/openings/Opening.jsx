import React from 'react'
import { useParams } from 'react-router-dom'
import OpeningList from '../../components/openings/OpeningList'
import { NoAccessRedirect, useModuleAccess } from '../../helper/access'

const METHODS = ["list"];

const Opening = () => {
    let { method } = useParams();
    const hasAccess = useModuleAccess("openings");

    if (!hasAccess || !METHODS.includes(method)) return <NoAccessRedirect />;

    return (
        <>
            {method === "list" && <OpeningList />}
        </>
    )
}

export default Opening
