export default (delegate, mutations) => {

    return {
        getVariables: () => {
            return delegate.state.project.variables
        },
        handleChange: ({variables}) => {

            let {project} = delegate.state

            project = Object.assign({}, project, {
                variables
            })

            mutations.updateProject({
                projectId: project._id,
                input: project
            }).then(delegate.fetchProject({projectId: project._id}))
        }
    }
}