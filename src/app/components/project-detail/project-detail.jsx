import React from 'react'
import electron from "electron"
import moment from "moment"
import {introspectionQuery, buildClientSchema} from 'graphql'
import getQueryFacts from "app/components/graphiql/utils/get-query-facts"
import {fromJS, Map, List} from "immutable"
import uuid from "uuid"
import VariableEditorController from "./variable-editor-controller"
import HeaderEditorController from "./header-editor-controller"
import reduce from "lodash/reduce"
import forEach from "lodash/forEach"
import get from "lodash/get"
import createModal from "app/utils/create-modal"
import querystring from "querystring"
import omitBy from "lodash/omitBy"
import isNil from "lodash/isNil"
import isEmpty from "lodash/isEmpty"
import merge from "lodash/merge"

const DEFAULT_GET_HEADERS = {}

const DEFAULT_POST_HEADERS = {
    'content-type': 'application/json'
}

const NEW_QUERY = Map({
    method: 'POST',
    query: '',
    operationName: '',
    variables: '',
    headers: List()
})

function writeQuery({query}) {

    const variables = query.get('variables')

    return {
        type: query.get('type'),
        method: query.get('method'),
        query: query.get('query'),
        title: query.get('title'),
        operationName: query.get('operationName'),
        variables: variables ? JSON.parse(variables) : null,
        operationType: query.get('operationType'),
        headers: query.get('headers').toJSON(),
        duration: query.get('duration'),
        endpointId: query.get('endpointId'),
        updatedAt: query.get('updatedAt'),
        createdAt: query.get('createdAt')
    }
}

function readQuery({query}) {

    return Map({
        _id: query._id,
        title: query.title,
        type: query.type,
        method: query.method,
        query: query.query,
        operationName: query.operationName,
        variables: query.variables ? JSON.stringify(query.variables, null, 4) : '',
        operationType: query.operationType,
        headers: fromJS(query.headers),
        duration: query.duration,
        endpointId: query.endpointId,
        updatedAt: query.updatedAt,
        createdAt: query.createdAt
    })
}

function getOperationType({schema, query, operationName}) {

    const queryFacts = getQueryFacts(schema, query)

    let operation = queryFacts.operations.find(operation => {
        return operation.name && operation.name.value === operationName
    })

    if (!operation) {
        operation = queryFacts.operations[0]
    }

    return operation.operation
}

function getQueryEndpointOrProjectDefault(query, project) {

    const id = query.endpointId || null

    if (id) {
        const endpoint = project.endpoints.find(endpoint => endpoint.id === id)

        if (endpoint) {
            return endpoint
        }
    }

    return project.endpoints.find(endpoint => endpoint.isDefault)
}

function applyVariablesToHeaders(headers, variables) {

    return reduce(headers, (result, headerValue, headerKey) => {

        forEach(variables, (varValue, varKey) => {
            headerValue = headerValue.replace(`{{${varKey}}}`, varValue)
        })

        result[headerKey] = headerValue

        return result
    }, {})
}

function transformHeaders({headers}) {

    return headers.reduce((result, header) => {
        result[header.get('key')] = header.get('value')
        return result
    }, {})
}

export default (mutations, queries, history, Loader, Layout, WorkspaceHeader, MenuItem, VariableEditor, HeaderEditor, QueryList, GraphiQL, ProjectFormModal) => {

    ProjectFormModal = createModal(ProjectFormModal)

    return class ProjectDetail extends React.Component {

        ctrls = {
            projectFormModal: null,
            graphiql: null
        }

        state = {
            panel: null,
            project: true,
            queries: true,
            loading: true,
            operationName: '',
            schemas: Map(),
            query: NEW_QUERY
        }

        constructor(props) {
            super(props)
            this.variableEditorController = VariableEditorController(this, mutations)
            this.headerEditorController = HeaderEditorController(this)
        }

        componentDidMount() {

            const {id} = this.props.params

            this.fetchProject({projectId: id})
                .then(() => this.fetchQueries({projectId: id}))
                .then(() => {
                    const endpoint = getQueryEndpointOrProjectDefault(this.state.query, this.state.project)
                    return this.fetchSchema(endpoint)
                })
                .then(() => {

                    this.setState({
                        loading: false
                    })
                })
        }

        newQuery() {

            const endpoint = getQueryEndpointOrProjectDefault(this.state.query, this.state.project)

            this.setState({
                query: Object.assign({}, NEW_QUERY, {
                    endpointId: endpoint.id
                })
            })
        }

        fetchProject({projectId}) {

            return queries.findProject({projectId}).then(project => {

                return new Promise((resolve, reject) => {

                    this.setState({
                        project
                    }, () => resolve(project))
                })
            })
        }

        fetchQueries({projectId}) {

            return queries.findProjectQueries({
                projectId,
                type: this.state.project.settings.queryListState
            }).then(queries => {

                this.setState({
                    queries
                })
            })
        }

        fetchSchema(endpoint) {

            return this.fetchQuery({
                url: endpoint.url,
                method: 'POST',
                headers: {},
                params: {
                    query: introspectionQuery
                }
            }).then(response => {

                this.setState({
                    schemas: this.state.schemas.set(endpoint.id, buildClientSchema(response.data))
                })
            }).catch(e => {

                let errors = get(e, 'response.data.errors')

                errors = errors ? errors.map(error => `• ${error.message}\n`) : null

                electron.remote.dialog.showErrorBox(`Exception - ${e.toString()}`, `Unable to fetch schema for '${endpoint.url}'\n\n ${errors}`)
            })
        }

        render() {

            if (this.state.loading) {

                return (
                    <Loader
                        message="Loading project details"
                    />
                )
            }

            const endpoint = getQueryEndpointOrProjectDefault(this.state.query, this.state.project)

            const buttonsLeft = [{
                description: 'Back',
                onClick: () => history.push('/project-list')
            }, {
                description: 'Collection',
                active: this.state.project.settings.queryListState === 'COLLECTION',
                onClick: () => this.setQueryListState('COLLECTION')
            }, {
                description: 'History',
                active: this.state.project.settings.queryListState === 'HISTORY',
                onClick: () => this.setQueryListState('HISTORY')
            }]

            const headerLeft = (
                <div className="Menu Menu--horizontal">
                    {buttonsLeft.map((item, key) => (
                        <MenuItem
                            key={key}
                            active={item.active}
                            description={item.description}
                            onClick={item.onClick}
                        />
                    ))}
                </div>
            )

            const headerCenter = (
                <div className="Title">
                    {this.state.project.title}
                </div>
            )

            const buttonsRight = [{
                description: 'Settings',
                onClick: this.handleProjectEdit
            }, {
                description: (this.state.panel === 'variableEditor' ? 'Hide' : 'Show') + ' variables',
                active: this.state.panel === 'variableEditor',
                onClick: () => {
                    this.setState({
                        panel: this.state.panel === 'variableEditor' ? null : 'variableEditor'
                    })
                }
            }, {
                description: (this.state.panel === 'headerEditor' ? 'Hide' : 'Show') + ' headers',
                active: this.state.panel === 'headerEditor',
                onClick: () => {
                    this.setState({
                        panel: this.state.panel === 'headerEditor' ? null : 'headerEditor'
                    })
                }
            }]

            const headerRight = (
                <div className="Menu Menu--horizontal Menu--right">
                    <div className="MenuItem">
                        {this.renderMethodsSelect()}
                    </div>
                    <div className="MenuItem">
                        {this.renderEndpointsSelect()}
                    </div>
                    {buttonsRight.map((item, key) => (
                        <MenuItem
                            key={key}
                            active={item.active}
                            description={item.description}
                            onClick={item.onClick}
                        />
                    ))}
                </div>
            )

            const HEADER_HEIGHT = 40
            const PANEL_HEIGHT = this.state.panel !== null ? 200 : 0
            const DRAWER_WIDTH = 350

            return (
                <Layout>
                    {({width, height}) => (
                        <div className="ProjectDetail">
                            <WorkspaceHeader
                                width={width}
                                height={HEADER_HEIGHT}
                                left={headerLeft}
                                center={headerCenter}
                                right={headerRight}
                            />
                            {this.state.panel === 'headerEditor' ? (
                                <HeaderEditor
                                    top={HEADER_HEIGHT}
                                    width={width}
                                    height={PANEL_HEIGHT}
                                    headers={this.headerEditorController.getHeaders()}
                                    onHeaderAddClick={this.headerEditorController.handleAddClick}
                                    onHeaderClearClick={this.headerEditorController.handleClear}
                                    onHeaderChange={this.headerEditorController.handleChange}
                                    onHeaderRemove={this.headerEditorController.handleRemove}
                                />
                            ) : null}
                            {this.state.panel === 'variableEditor' ? (
                                <VariableEditor
                                    top={HEADER_HEIGHT}
                                    width={width}
                                    height={PANEL_HEIGHT}
                                    variables={this.variableEditorController.getVariables()}
                                    onChange={this.variableEditorController.handleChange}
                                />
                            ) : null}
                            <div className="ProjectDetailContent"
                                 style={{
                                     top: HEADER_HEIGHT + PANEL_HEIGHT,
                                     height: height - HEADER_HEIGHT - PANEL_HEIGHT
                                 }}
                            >
                                <div
                                    className="ProjectDetail__Drawer"
                                    style={{
                                        width: DRAWER_WIDTH,
                                        height: height - HEADER_HEIGHT - PANEL_HEIGHT
                                    }}
                                >
                                    <QueryList
                                        data={this.state.queries}
                                        rowHeight={72}
                                        activeId={this.state.query && this.state.query._id}
                                        onItemClick={this.handleQueryClick}
                                        onItemRemove={this.handleQueryRemove}
                                    />
                                </div>
                                <div
                                    className="ProjectDetail__GraphiQL"
                                    style={{
                                        width: width - DRAWER_WIDTH,
                                        height: height - HEADER_HEIGHT - PANEL_HEIGHT
                                    }}
                                >
                                    <GraphiQL
                                        ref={ref => this.ctrls.graphiql = ref}
                                        schema={this.state.schemas.get(endpoint.id)}
                                        fetcher={this.graphQLFetcher}
                                        onEditQuery={this.handleEditQuery}
                                        onEditVariables={this.handleEditVariables}
                                        onEditOperationName={this.handleEditOperationName}
                                        query={this.state.query.get('query')}
                                        operationName={this.state.query.get('operationName')}
                                        variables={this.state.query.get('variables')}
                                    >
                                        <GraphiQL.Toolbar>
                                            <input
                                                ref={ref => this.ctrls.operationNameInput = ref}
                                                className="toolbar-input"
                                                value={this.state.operationName || ''}
                                                onChange={this.handleOperationNameChange}
                                            />
                                            <button className="toolbar-button" onClick={this.handleSaveQuery}>
                                                Save
                                            </button>
                                        </GraphiQL.Toolbar>
                                    </GraphiQL>
                                </div>
                            </div>
                            <div className="overlay">
                                <ProjectFormModal
                                    ref={ref => this.ctrls.projectFormModal = ref}
                                    title="Edit Project"
                                />
                            </div>
                        </div>
                    )}
                </Layout>
            )
        }

        handleSaveQuery = () => {

            let {query} = this.state

            const endpoint = getQueryEndpointOrProjectDefault(this.state.query, this.state.project)

            query = query.merge({
                title: this.state.operationName,
                operationType: getOperationType({
                    schema: this.state.schemas.get(endpoint.id),
                    query: query.get('query'),
                    operationName: this.state.query.get('operationName')
                })
            })

            const projectId = this.state.project._id

            if (query.get('type') === 'COLLECTION') {

                const id = query.get('_id')

                mutations.updateQuery({
                    projectId,
                    queryId: id,
                    input: writeQuery({
                        query: query
                    })
                }).then(() => {
                    this.fetchQueries({projectId})
                })
            } else {

                query = query.merge({
                    type: 'COLLECTION',
                    duration: null // Duration not relevant for collection queries
                })

                mutations.createQuery({
                    projectId,
                    input: writeQuery({
                        query: query
                    })
                }).then(() => {
                    this.fetchQueries({projectId})
                })
            }

        }

        handleProjectEdit = () => {

            this.ctrls.projectFormModal.open({
                project: Map({
                    title: this.state.project.title,
                    description: this.state.project.description,
                    endpoints: fromJS(this.state.project.endpoints)
                })
            })
                .then(result => {

                    if (result.status === 'SAVE') {

                        const projectId = this.state.project._id

                        mutations.updateProject({
                            projectId,
                            input: Object.assign({}, this.state.project, result.payload.input.toJSON())
                        }).then(() => {
                            this.fetchProject({projectId})
                        })
                    }
                })
        }

        renderMethodsSelect() {

            const method = this.state.query.get('method')

            return (
                <select ref="method" name="method" className="Select form-control" value={method}
                        onChange={this.handleMethodChange}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                </select>
            )
        }

        renderEndpointsSelect() {

            const endpoint = getQueryEndpointOrProjectDefault(this.state.query, this.state.project)

            return (
                <select ref="endpoint" name="endpoint" className="Select form-control" value={endpoint.id}
                        onChange={this.handleEndpointChange}>
                    {this.state.project.endpoints.map(endpoint => (
                        <option
                            key={endpoint.id}
                            value={endpoint.id}
                        >
                            {endpoint.title} - {endpoint.url}
                        </option>
                    ))}
                </select>
            )
        }

        ensureSchema(endpoint) {

            if (!this.state.schemas.has(endpoint.id)) {
                this.fetchSchema(endpoint)
            }
        }

        handleMethodChange = () => {

            const method = this.refs.method.value

            this.setState({
                query: this.state.query.set('method', method)
            })
        }

        handleEndpointChange = () => {

            const id = this.refs.endpoint.value

            const endpoint = this.state.project.endpoints.find(endpoint => endpoint.id === id)

            this.setState({
                query: this.state.query.set('endpointId', id)
            }, () => {
                this.ensureSchema(endpoint)
            })
        }

        handleOperationNameChange = () => {

            this.setState({
                operationName: this.ctrls.operationNameInput.value
            })
        }

        handleEditQuery = (query) => {

            this.setState({
                query: this.state.query.set('query', query)
            })
        }

        handleEditVariables = (variables) => {

            this.setState({
                query: this.state.query.set('variables', variables)
            })
        }

        handleEditOperationName = (operationName) => {

            this.setState({
                operationName: operationName,
                query: this.state.query.set('operationName', operationName)
            })
        }

        setQueryListState = state => {

            const projectId = this.state.project._id

            mutations.setProjectSetting({
                projectId,
                key: 'queryListState',
                value: state
            }).then(project => {

                this.fetchProject({
                    projectId
                }).then(() => this.fetchQueries({
                    projectId
                }))
            })
        }

        fetchQuery = ({url, method, headers, params}) => {

            params = omitBy(params, isNil)
            params = omitBy(params, isEmpty)

            let options = {
                method,
                credentials: 'include'
            }

            if (method == "GET") {

                options.headers = merge(DEFAULT_GET_HEADERS, headers)

                url += url.indexOf('?') == -1 ? "?" : "&"

                url += querystring.stringify(params)
            }

            else {

                options.headers = merge(DEFAULT_POST_HEADERS, headers)

                options.body = JSON.stringify(params)
            }

            console.log({
                url,
                options
            })

            return fetch(url, options).then(res => res.json())
        }

        graphQLFetcher = (params) => {

            let {query} = this.state

            const headers = transformHeaders({
                headers: query.get('headers')
            })

            const endpoint = getQueryEndpointOrProjectDefault(query, this.state.project)

            const startTime = moment()

            return this.fetchQuery({
                url: endpoint.url,
                method: query.get('method'),
                headers: applyVariablesToHeaders(headers, this.state.project.variables),
                params: {
                    query: query.get('query'),
                    operationName: query.get('operationName'),
                    variables: query.get('variables')
                }
            }).then(response => {

                query = query.merge({
                    title: this.state.operationName,
                    type: 'HISTORY',
                    duration: +moment() - +startTime,
                    endpointId: endpoint.id,
                    operationType: getOperationType({
                        schema: this.state.schemas.get(endpoint.id),
                        query: query.get('query'),
                        operationName: query.get('operationName')
                    })
                })

                const projectId = this.state.project._id

                mutations.createQuery({
                    projectId,
                    input: writeQuery({
                        query
                    })
                }).then(() => {
                    this.fetchQueries({projectId})
                })

                return response.data
            })
        }

        handleQueryClick = ({id}) => {

            queries.findQuery({queryId: id}).then(query => {

                query = readQuery({query})

                this.setState({
                    query,
                    operationName: query.get('title')
                })
            })
        }

        handleQueryRemove = ({id}) => {

            mutations.removeQuery({queryId: id}).then(() => {
                this.fetchQueries({projectId: this.state.project._id})
            })
        }
    }
}