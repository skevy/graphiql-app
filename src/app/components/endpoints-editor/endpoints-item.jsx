import React from "react"
import ReactDOM from "react-dom"
import {Map} from "immutable"
import {FormGroup, FormControl, ControlLabel} from "react-bootstrap"

export default () => {

    return class EndpointsItem extends React.Component {

        state = {
            invalid: false,
            endpoint: Map({
                title: '',
                url: ''
            })
        }

        componentWillMount() {
            this.setState({
                endpoint: this.props.endpoint
            })
        }

        componentWillUpdate(nextProps) {

            if (this.props.endpoint !== nextProps.endpoint) {
                this.setState({
                    endpoint: nextProps.endpoint
                })
            }
        }

        componentDidMount() {

            if (this.refs.url) {
                ReactDOM.findDOMNode(this.refs.url).focus()
            }
        }

        getValidationState(field) {
            return null
        }

        render() {

            return (
                <div className="EndpointsItem">
                    <div className="EndpointsItem__Element EndpointsItem__Title">
                        <input
                            ref="title"
                            className="Input"
                            placeholder="Enter a title"
                            value={this.state.endpoint.get('title')}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="EndpointsItem__Element EndpointsItem__Url">
                        <input
                            ref="url"
                            className="Input"
                            placeholder="Enter a url"
                            value={this.state.endpoint.get('url')}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className="EndpointsItem__Element EndpointsItem__Default">
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    ref="isDefault"
                                    checked={this.state.endpoint.get('isDefault')}
                                    onChange={this.handleChange}
                                /> Default
                            </label>
                        </div>

                    </div>
                    <div className="EndpointsItem__Element EndpointsItem__RemoveButton">
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
                endpoint: this.state.endpoint.merge({
                    title: this.refs.title.value,
                    url: this.refs.url.value,
                    isDefault: this.refs.isDefault.checked
                })
            }, () => {

                this.props.onChange({
                    e,
                    id: this.props.id,
                    endpoint: this.state.endpoint
                })
            })
        }

        handleRemove = e => {

            this.props.onRemove({
                id: this.props.id
            })
        }
    }
}