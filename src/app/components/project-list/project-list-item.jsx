import React from "react"
import ReactDOM from "react-dom"
import {remote} from "electron"
const {Menu, MenuItem} = remote

export default () => {

    return class ProjectListItem extends React.Component {

        state = {
            menu: null
        }

        componentWillMount() {

            const menu = new Menu()
            const items = [
                new MenuItem({
                    label: 'Export Project',
                    click: this.handleExport
                }),
                new MenuItem({
                    type: 'separator',
                }),
                new MenuItem({
                    label: 'Delete Project',
                    click: this.handleRemove
                })
            ]

            items.forEach(item => menu.append(item))

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
                <div className="ProjectListItem" onClick={this.handleClick}>
                    <div className="ProjectListItem__Body">
                        <div
                            className="ProjectListItem__Icon"
                            style={{
                                backgroundColor: this.props.backgroundColor,
                                color: this.props.color
                            }}
                        >
                            {this.props.shortname}
                        </div>
                        <div className="ProjectListItem__Title truncate-text">
                            {this.props.title}
                        </div>
                        <div className="ProjectListItem__Description truncate-text">
                            {this.props.description}
                        </div>
                        <div className="ProjectListItem__Meta truncate-text">
                            {this.props.meta}
                        </div>
                    </div>
                </div>
            )
        }

        handleContextMenu = e => {
            e.preventDefault()

            if (this.props.onRemove) {
                this.state.menu.popup(remote.getCurrentWindow())
            }
        }

        handleExport = e => {
            this.props.onExport({
                id: this.props.id,
                e
            })
        }

        handleRemove = e => {
            this.props.onRemove({
                id: this.props.id,
                e
            })
        }

        handleClick = e => {
            this.props.onClick({
                id: this.props.id,
                e
            })
        }
    }
}