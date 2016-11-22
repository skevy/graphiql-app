import React from "react"
import createModal from "app/utils/create-modal"
import electron from "electron"
import {Map, List} from "immutable"
import moment from "moment"

export default (mutations, queries, importExport, history, Layout, WorkspaceHeader, MenuItem, ProjectListItem, ProjectFormModal) => {

    ProjectFormModal = createModal(ProjectFormModal)

    return class ProjectList extends React.Component {

        state = {
            projects: []
        }

        ctrls = {
            projectFormModal: null
        }

        componentDidMount() {
            this.fetchProjects()
        }

        fetchProjects() {

            queries.allProjects().then(projects => {

                this.setState({
                    projects
                })
            })
        }

        render() {

            const HEADER_HEIGHT = 40

            const leftButtons = [{
                description: 'Import',
                onClick: this.handleProjectImport
            }]

            const headerLeft = (
                <div className="Menu Menu--horizontal">
                    {leftButtons.map((item, key) => (
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
                    <span>
                        Graph<em>i</em>QL App
                    </span>
                </div>
            )

            const rightButtons = [{
                description: 'Quit',
                onClick: () => {
                    electron.remote.app.quit()
                }
            }]

            const headerRight = (
                <div className="Menu Menu--horizontal Menu--right">
                    {rightButtons.map((item, key) => (
                        <MenuItem
                            key={key}
                            active={item.active}
                            description={item.description}
                            onClick={item.onClick}
                        />
                    ))}
                </div>
            )

            return (
                <Layout>
                    {({width, height}) => (
                        <div
                            className="ProjectList"
                            style={{
                                width,
                                height
                            }}
                        >
                            <WorkspaceHeader
                                width={width}
                                height={HEADER_HEIGHT}
                                left={headerLeft}
                                center={headerCenter}
                                right={headerRight}
                            />
                            <div
                                className="ProjectListContent"
                                style={{
                                    top: HEADER_HEIGHT,
                                    width,
                                    height: height - HEADER_HEIGHT
                                }}
                            >
                                <div className="container">
                                    <div className="page-header">
                                        <h2>
                                            Projects
                                        </h2>
                                    </div>
                                    <div className="row">
                                        <div className="col-sm-6 col-md-4">
                                            <ProjectListItem
                                                backgroundColor="#eee"
                                                color="#222"
                                                shortname="+"
                                                title={"New project"}
                                                description={"Click to start new project"}
                                                onClick={this.handleNewClick}
                                            />
                                        </div>
                                        {this.state.projects.map(project => (
                                            <div key={project._id} className="col-sm-6 col-md-4">
                                                <ProjectListItem
                                                    id={project._id}
                                                    backgroundColor="#E10098"
                                                    color="#fff"
                                                    shortname={(project.title || "").substring(0, 2)}
                                                    title={project.title}
                                                    description={project.description}
                                                    meta={moment(project.updatedAt).format('DD/MM/YYYY HH:mm')}
                                                    onClick={this.handleClick}
                                                    onRemove={this.handleRemove}
                                                    onExport={this.handleProjectExport}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="overlay">
                                <ProjectFormModal
                                    ref={ref => this.ctrls.projectFormModal = ref}
                                    title="Create Project"
                                />
                            </div>
                        </div>
                    )}
                </Layout>
            )
        }

        handleProjectImport = () => {

            importExport.importProject().then(() => this.fetchProjects())
        }

        handleProjectExport = ({id}) => {

            importExport.exportProject({projectId: id})
        }

        handleClick = ({id}) => {

            history.push('/project/' + id)
        }

        handleRemove = ({id}) => {

            mutations.removeProject({
                projectId: id
            }).then(() => this.fetchProjects())
        }

        handleNewClick = () => {

            this.ctrls.projectFormModal.open({
                project: Map({
                    title: '',
                    description: '',
                    endpoints: List()
                })
            })
                .then(result => {

                    if (result.status === 'SAVE') {

                        mutations.createProject({
                            input: result.payload.input.toJSON()
                        }).then(() => {
                            this.fetchProjects()
                        })
                    }
                })
        }
    }
}