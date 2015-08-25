import _ from 'lodash';
import React from 'react';
import fetch from 'isomorphic-fetch';
import GraphiQL from 'graphiql/dist/index';
import Modal from 'react-modal/lib/index';

Modal.setAppElement(document.getElementById('react-root'));
Modal.injectCSS();

import HTTPHeaderEditor from './HTTPHeaderEditor';


export default class App extends React.Component {
  constructor() {
    super();

    const storage = window.localStorage;

    this.state = {
      headers: JSON.parse(storage.getItem('graphiqlHeaders') || '{}'),
      endpoint: storage.getItem('graphiqlEndpoint') || 'http://localhost:9000/data',
      method: storage.getItem('graphiqlMethod') || 'post',
      headerEditOpen: false
    }
  }

  updateLocalStorage() {
    window.localStorage.setItem('graphiqlHeaders', JSON.stringify(this.state.headers));
    window.localStorage.setItem('graphiqlEndpoint', this.state.endpoint);
    window.localStorage.setItem('graphiqlMethod', this.state.method);
  }

  graphQLFetcher = (graphQLParams) => {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    return fetch(this.state.endpoint, {
      method: this.state.method,
      headers: Object.assign({}, defaultHeaders, this.state.headers),
      body: JSON.stringify(graphQLParams)
    }).then(response => response.json());
  }

  handleChange(field, e) {
    this.setState({
      [field]: e.target.value
    }, () => {
      this.updateLocalStorage();
    });
  }

  openHeaderEdit = () => {
    this.setState({
      headerEditOpen: true
    });
  }

  closeModal = () => {
    this.setState({
      headerEditOpen: false
    });
  }

  getHeadersFromModal = (headers) => {
    this.setState({
      headers: headers
    }, () => {
      this.updateLocalStorage();
    });
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
          <div className="field headers">
            <a href="javascript:;" onClick={this.openHeaderEdit}>Edit HTTP Headers</a>
          </div>
        </div>
        {
          // THIS IS THE GROSSEST THING I'VE EVER DONE AND I HATE IT. FIX ASAP
        }
        <GraphiQL key={this.state.endpoint + JSON.stringify(this.state.headers)} fetcher={this.graphQLFetcher}  />

        <Modal isOpen={this.state.headerEditOpen} onRequestClose={this.closeModal}>
          <HTTPHeaderEditor
            headers={_.map(this.state.headers, (value, key) => ({ key, value }))}
            onCreateHeaders={this.getHeadersFromModal}
            closeModal={this.closeModal} />
        </Modal>
      </div>
    );
  }
}
