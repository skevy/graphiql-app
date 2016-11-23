import validator from "validator"
import React from "react"
import ReactDOM from "react-dom"
import {Alert, Modal, FormGroup, FormControl, ControlLabel} from "react-bootstrap"
import {Map, List} from "immutable"

export default (EndpointsEditor) => {

    return class ProjectFormModal extends React.Component {

        state = {
            errors: List(),
            changed: Map({
                title: false,
                description: false,
                endpoints: false
            }),
            project: Map({
                title: '',
                description: '',
                endpoints: List()
            })
        }

        componentWillMount() {
            this.updateProject(this.props)
        }

        componentWillUpdate(nextProps) {

            if (this.props.project !== nextProps.project) {
                this.updateProject(nextProps)
            }
        }

        updateProject(props) {
            this.setState({
                project: props.project
            })
        }

        componentDidMount() {

            this.validate()

            if (this.refs.title) {
                ReactDOM.findDOMNode(this.refs.title).focus()
            }
        }

        validate() {

            const title = this.state.project.get('title')
            const description = this.state.project.get('description')
            const endpoints = this.state.project.get('endpoints')

            const checks = [() => {

                const opts = {
                    min: 3,
                    max: 255
                }

                if (!validator.isLength(title, opts)) {
                    return Map({
                        name: 'title',
                        message: `Length of 'Title' should be between ${opts.min} and ${opts.max} characters long`
                    })
                }

            }, () => {

                const opts = {
                    min: 0,
                    max: 500
                }

                if (!validator.isLength(description, opts)) {
                    return Map({
                        name: 'title',
                        message: `'Description' should not exceed ${opts.max} characters`
                    })
                }

            }, () => {

                if (endpoints.isEmpty()) {
                    return Map({
                        name: 'endpoints',
                        message: `You need to have at least on endpoint configured`
                    })
                }
            }]

            const errors = checks.reduce((result, check) => {

                const error = check()

                if (error) {
                    return result.push(error)
                }

                return result

            }, List())

            this.setState({
                errors
            })
        }

        getValidationState = (fieldName) => {

            const error = this.state.errors.find(field => field.get('name') === fieldName)

            if (this.state.changed.get(fieldName)) {
                return error ? 'error' : 'success'
            }

            return null
        }

        render() {

            return (

                <Modal show={true} onHide={this.props.close}>
                    <form onSubmit={this.handleSubmit}>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                {this.props.title}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {this.state.message ? (
                                <Alert bsStyle="danger">
                                    {this.state.message}
                                </Alert>
                            ) : null}
                            <FormGroup
                                controlId="title"
                                validationState={this.getValidationState('title')}
                            >
                                <ControlLabel>Title</ControlLabel>
                                <FormControl
                                    ref="title"
                                    type="text"
                                    value={this.state.project.get('title')}
                                    placeholder="Enter a title"
                                    onChange={this.handleTitleChange}
                                />
                            </FormGroup>
                            <FormGroup
                                controlId="description"
                                validationState={this.getValidationState('description')}
                            >
                                <ControlLabel>Description</ControlLabel>
                                <FormControl
                                    componentClass="textarea"
                                    value={this.state.project.get('description')}
                                    placeholder="Enter an description"
                                    onChange={this.handleDescriptionChange}
                                />
                            </FormGroup>
                            <FormGroup
                                controlId="endpoints"
                                validationState={this.getValidationState('endpoints')}
                            >
                                <ControlLabel>Endpoints</ControlLabel>
                                <EndpointsEditor
                                    endpoints={this.state.project.get('endpoints')}
                                    onChange={this.handleEndpointsChange}
                                />
                            </FormGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            <button type="button" className="btn btn-default" onClick={this.props.close}>Close</button>
                            <button type="submit" className="btn btn-primary">Save</button>
                        </Modal.Footer>
                    </form>
                </Modal>


            )
        }

        handleTitleChange = e => {

            this.updateProjectProperty({
                property: 'title',
                value: e.target.value
            })
        }

        handleDescriptionChange = e => {

            this.updateProjectProperty({
                property: 'description',
                value: e.target.value
            })
        }

        handleEndpointsChange = ({endpoints}) => {

            this.updateProjectProperty({
                property: 'endpoints',
                value: endpoints
            })
        }

        updateProjectProperty = ({property, value}) => {

            this.setState({
                message: null,
                changed: this.state.changed.set(property, true),
                project: this.state.project.set(property, value)
            }, () => {
                this.validate()
            })
        }

        handleSubmit = e => {

            e.preventDefault()
            e.stopPropagation()

            if (!this.state.errors.isEmpty()) {
                this.setState({
                    message: (
                        <ul>
                            {this.state.errors.map((error, index) => (
                                <li key={index}>
                                    {error.get('message')}
                                </li>
                            )).toArray()}
                        </ul>
                    )
                })
                return
            }

            this.props.close('SAVE', {
                input: this.state.project
            })
        }
    }
}