import React from "react"
import {Router, Route, IndexRedirect} from "react-router"

export default (history, LayoutView, ProjectList, ProjectDetail) => {

    return class RouterView extends React.Component {

        render() {

            return (
                <Router history={history}>
                    <Route path="/" component={LayoutView}>
                        <IndexRedirect to="/project-list" />
                        <Route path="/project/:id" component={ProjectDetail} />
                        <Route path="/project-list" component={ProjectList} />
                    </Route>
                </Router>
            )
        }
    }
}