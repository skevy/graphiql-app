import React from "react"
import ReactDOM from "react-dom"
import {Map} from "immutable"
import cn from "classnames"

export default () => {

    return class VariableItem extends React.Component {

        state = {
            invalid: false,
            variable: Map({
                key: '',
                value: ''
            })
        }

        componentWillMount() {
            this.setState({
                variable: this.props.variable
            })
        }

        componentWillUpdate(nextProps) {

            if (this.props.variable !== nextProps.variable) {
                this.setState({
                    variable: nextProps.variable
                })
            }
        }

        componentDidMount() {

            if (this.refs.key) {
                ReactDOM.findDOMNode(this.refs.key).focus()
            }
        }

        render() {

            return (
                <div className="VariableItem">
                    <div className="VariableItem__Element VariableItem__Key">
                        <input
                            ref="key"
                            className={cn("Input", {error: this.state.invalid})}
                            value={this.state.variable.get('key')}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="VariableItem__Element VariableItem__Value">
                        <input
                            ref="value"
                            className="Input"
                            value={this.state.variable.get('value')}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="VariableItem__Element VariableItem__RemoveButton">
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

            this.setState({
                invalid: this.props.keyBlacklist.contains(this.refs.key.value),
                variable: Map({
                    key: this.refs.key.value,
                    value: this.refs.value.value
                })
            }, () => {

                if (!this.state.invalid) {
                    this.props.onChange({
                        e,
                        id: this.props.id,
                        variable: this.state.variable
                    })
                }
            })
        }

        handleRemove = e => {

            this.props.onRemove({
                id: this.props.id
            })
        }
    }
}