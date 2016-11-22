import React from "react"

export default () => {

    return (props) => (
        <div className="page-loader active">
            <div className="spinner">
                <div className="spinner__icon"></div>
                <div className="spinner__message">
                    {props.message}
                </div>
            </div>
        </div>
    )
}