import cn from "classnames"
import React from "react"
import ReactDOM from "react-dom"
import {remote} from "electron"
const {Menu, MenuItem} = remote

export default () => {

    return class QueryListItem extends React.Component {

        componentWillMount() {

            const menu = new Menu()
            const menuItem = new MenuItem({
                label: 'Delete Query',
                click: this.handleRemove
            })
            menu.append(menuItem)

            this.setState({
                menu
            })
        }

        componentDidMount() {

            const el = ReactDOM.findDOMNode(this)
            el.addEventListener('contextmenu', this.handleContextMenu)
        }

        componentWillUnmount() {

            const el = ReactDOM.findDOMNode(this)
            el.removeEventListener('contextmenu', this.handleContextMenu)
        }

        render() {

            return (
                <div
                    className={cn("QueryListItem", {
                        active: this.props.active
                    })}
                    onClick={this.handleClick}
                >
                    <div className="QueryListItem__Icon">
                        <div className="Icon">
                            <span>
                                {this.props.shortname}
                            </span>
                        </div>
                    </div>
                    <div className="QueryListItem__Body">
                        <div className="QueryListItem__Main">
                            <div className="QueryListItem__Title">
                            <span className="truncate-text">
                                {this.props.title}
                            </span>
                            </div>
                            <div className="QueryListItem__Meta">
                                <span>
                                    {this.props.meta}
                                </span>
                            </div>
                        </div>
                        <div className="QueryListItem__Main">
                            <div className="QueryListItem__Title">
                                {this.props.subTitle}
                            </div>
                            <div className="QueryListItem__Meta">
                                {this.props.subMeta}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        handleClick = e => {

            this.props.onClick({
                e,
                id: this.props.id
            })
        }

        handleRemove = e => {

            this.props.onRemove({
                e,
                id: this.props.id
            })
        }

        handleContextMenu = e => {
            e.preventDefault()

            if (this.props.onRemove) {
                this.state.menu.popup(remote.getCurrentWindow())
            }
        }
    }
}