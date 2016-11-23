import React from "react"
import ReactDOM from "react-dom"

export default () => {

    return class HeaderItem extends React.Component {

        componentDidMount() {

            if (this.refs.key) {
                ReactDOM.findDOMNode(this.refs.key).focus()
            }
        }

        render() {

            return (
                <div className="HeaderItem">
                    <div className="HeaderItem__Element HeaderItem__Key">
                        <input
                            ref="key"
                            className="Input"
                            value={this.props.header.get('key')}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="HeaderItem__Element HeaderItem__Value">
                        <input
                            ref="value"
                            className="Input"
                            value={this.props.header.get('value')}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="HeaderItem__Element HeaderItem__RemoveButton">
                        <button
                            type="button"
                            className="button"
                            onClick={this.handleRemove}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )
        }

        handleChange = e => {

            this.props.onChange({
                id: this.props.header.get('id'),
                e,
                header: this.props.header.merge({
                    key: this.refs.key.value,
                    value: this.refs.value.value
                })
            })
        }

        handleRemove = e => {

            this.props.onRemove({
                id: this.props.header.get('id'),
                e
            })
        }
    }
}