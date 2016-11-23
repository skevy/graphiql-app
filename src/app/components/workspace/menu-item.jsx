import React from "react"
import cn from "classnames"

export default () => {

    return class MenuItem extends React.Component {

        render() {

            return (
                <div
                    className="MenuItem"
                    onClick={this.props.onClick}
                >
                    <button
                        className={cn('button', {
                            active: this.props.active
                        })}
                    >
                        <span className="Label">
                            {this.props.description}
                        </span>
                    </button>
                </div>
            )
        }
    }
}