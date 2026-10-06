import React from 'react';
import { Blocks, TailSpin } from 'react-loader-spinner'

const ContentLoader = ({ loaderType }) => {
    if (loaderType === "circleSpin") {
        return <TailSpin visible={true} height="50" width="50" color="#0000FF" ariaLabel="tail-spin-loading" radius="1" wrapperClass="spin-wrapper" />
    }
    return (
        <div className='content-loader'>
            <Blocks visible={true} height="80" width="80" ariaLabel="blocks-loading" wrapperClass="blocks-wrapper" />
        </div>
    )
}

export default ContentLoader;
