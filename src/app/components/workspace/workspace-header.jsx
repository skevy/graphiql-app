import React from "react"

export default () => {

    return class WorkspaceHeader extends React.Component {

        render() {

            return (
                <div
                    className="Workspace__Header"
                    style={{
                        width: this.props.width,
                        height: this.props.height
                    }}
                >
                    <div className="HeaderSection HeaderSection--left">
                        {this.props.left}
                    </div>
                    <div className="HeaderSection HeaderSection--right">
                        {this.props.right}
                    </div>
                </div>
            )
        }
    }
}