import React from 'react';
import fetch from 'isomorphic-fetch';
import GraphiQL from 'graphiql/dist/index.js';


export default class App extends React.Component {
  state = {
    headers: {
      'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwiZW1haWwiOiJhZGFtQGJvbHN0ZXJsYWJzLmNvbSIsInNvY2lhbCI6eyJzZXJ2aWNlIjoiZmFjZWJvb2sifSwiaWF0IjoxNDM5NzYzNTA3fQ.BSShOeF_17phaoJIcIpt3sbbSCxLTW-t5aJ1kGz5huY'
    },
    endpoint: 'http://localhost:9000/data',
    method: 'post'
  }

  handleChange(field, e) {
    this.setState({
      [field]: e.target.value
    }, () => {
      console.log(this.state);
    });
  }

  graphQLFetcher = (graphQLParams) => {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    console.log(this.state.endpoint, this.state.method, Object.assign({}, defaultHeaders, this.state.headers));

    return fetch(this.state.endpoint, {
      method: this.state.method,
      headers: Object.assign({}, defaultHeaders, this.state.headers),
      body: JSON.stringify(graphQLParams)
    }).then(response => response.json());
  }

  render() {
    return (
      <div className="wrapper">
        <div className="config-form clearfix">
          <div className="field">
            <label htmlFor="endpoint">GraphQL Endpoint</label>
            <input type="text" name="endpoint"
              value={this.state.endpoint} onChange={this.handleChange.bind(this, 'endpoint')} />
          </div>
          <div className="field">
            <label htmlFor="method">Method</label>
            <select name="method" value={this.state.method} onChange={this.handleChange.bind(this, 'method')}>
              <option value="get">GET</option>
              <option value="post">POST</option>
            </select>
          </div>

        </div>
        <GraphiQL key={this.state.endpoint} fetcher={this.graphQLFetcher}  />
      </div>
    );
  }
}
