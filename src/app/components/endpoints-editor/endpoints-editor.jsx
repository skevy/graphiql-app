import React from "react"
import {Map, List} from "immutable"
import uuid from "uuid"

export default (EndpointItem) => {

    return class EndpointsEditor extends React.Component {

        state = {
            endpoints: List()
        }

        componentDidMount() {
            this.computeEndpoints(this.props)
        }

        componentWillUpdate(nextProps) {

            if (this.props.endpoints !== nextProps.endpoints) {
                this.computeEndpoints(nextProps)
            }
        }

        computeEndpoints(props) {

            this.setState({
                endpoints: props.endpoints
            })
        }

        render() {

            return (
                <div
                    className="EndpointsEditor"
                    style={{
                        top: this.props.top,
                        width: this.props.width,
                        height: this.props.height
                    }}
                >
                    {this.state.endpoints.size ? (
                        <div className="EndpointsEditorBody">
                            {this.state.endpoints.map((endpoint, index) => (
                                <EndpointItem
                                    key={index}
                                    id={endpoint.get('id')}
                                    endpoint={endpoint}
                                    onChange={this.handleChange}
                                    onRemove={this.handleRemove}
                                />
                            )).toArray()}
                        </div>
                    ) : (
                        <div className="EndpointsEditorBody">
                            <div className="NoEndpoints">
                                <div className="NoEndpoints__Message">
                                    No endpoints (yet)
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="EndpointsEditorFooter">
                        <div className="Menu--horizontal Menu--right">
                            <div className="MenuItem">
                                <button
                                    type="button"
                                    className="button"
                                    onClick={this.handleClearClick}
                                >
                                    Clear endpoints
                                </button>
                            </div>
                            <div className="MenuItem">
                                <button
                                    type="button"
                                    className="button"
                                    onClick={this.handleAddClick}
                                >
                                    Add endpoint
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        handleAddClick = e => {

            if (this.state.endpoints.find(endpoint => endpoint.get('key') === '')) {
                return
            }

            const firstDefault = !this.state.endpoints.find(endpoint => endpoint.get('isDefault') === true)

            this.setState({
                endpoints: this.state.endpoints.push(Map({
                    id: uuid.v4(),
                    title: 'Default',
                    url: '',
                    isDefault: firstDefault
                }))
            }, () => this.emitChanges())
        }

        handleChange = ({id, endpoint}) => {

            let endpoints = this.state.endpoints.map(existingEndpoint => {

                if (existingEndpoint.get('id') === id) {
                    return endpoint
                }

                if (endpoint.get('isDefault')) {
                    existingEndpoint = existingEndpoint.set('isDefault', false)
                }

                return existingEndpoint
            })

            const firstDefault = !endpoints.find(endpoint => endpoint.get('isDefault') === true)

            if (firstDefault && !endpoints.isEmpty()) {
                endpoints = endpoints.set(0, endpoints.get(0).set('isDefault', true))
            }

            this.setState({
                endpoints
            }, () => this.emitChanges())
        }

        handleRemove = ({id}) => {

            this.setState({
                endpoints: this.state.endpoints.filter(endpoint => endpoint.get('id') !== id)
            }, () => this.emitChanges())
        }

        handleClearClick = e => {

            this.setState({
                endpoints: List()
            }, () => this.emitChanges())
        }

        emitChanges() {

            this.props.onChange({
                endpoints: this.state.endpoints
            })
        }
    }
}