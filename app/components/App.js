/*global Mousetrap*/
import _ from 'lodash';
import uuid from 'uuid';
import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql/dist';
import Modal from 'react-modal/lib/index';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

Modal.setAppElement(document.getElementById('react-root'));

import HTTPHeaderEditor from './HTTPHeaderEditor';


export default class App extends React.Component {
  constructor() {
    super();

    const storage = window.localStorage;

    this.state = {
      headerEditOpen: false,
      currentTabIndex: storage.getItem('currentTabIndex') ? parseInt(storage.getItem('currentTabIndex')) : 0,
      tabs: storage.getItem('tabs') ? JSON.parse(storage.getItem('tabs')) : [
        {
          name: null,
          headers: {},
          endpoint: '',
          method: 'post'
        }
      ]
    };
  }

  componentDidMount() {
    Mousetrap.bindGlobal('command+shift+]', (e) => {
      e.preventDefault();
      this.gotoNextTab();
      return false;
    });

    Mousetrap.bindGlobal('command+shift+[', (e) => {
      e.preventDefault();
      this.gotoPreviousTab();
      return false;
    });
  }

  handleElectronMenuOption(option) {
    switch (option) {
      case 'NEW_TAB':
        this.createNewTab();
        break;
      case 'CLOSE_TAB':
        this.closeCurrentTab();
        break;
      case 'NEXT_TAB':
        this.gotoNextTab();
        break;
      case 'PREVIOUS_TAB':
        this.gotoPreviousTab();
        break;
      case 'EXPORT_QUERY':
        this.exportQuery();
        break;
      default:
        console.error("No idea how to handle '" + option + "'");
        break;
    }
  }

  createNewTab() {
    const currentTab = this.getCurrentTab();
    const newTabIndex = this.state.tabs.length;

    this.setState({
      tabs: [...this.state.tabs, {
        uuid: uuid.v1(),
        headers: currentTab.headers,
        endpoint: currentTab.endpoint,
        method: currentTab.method
      }],
      currentTabIndex: newTabIndex
    }, () => {
      this.updateLocalStorage();
    });
  }

  closeCurrentTab() {
    const currentTabIndex = this.state.currentTabIndex;
    let gotoTabIndex = currentTabIndex - 1;
    if (currentTabIndex === 0) {
      gotoTabIndex = 0;
    }

    let newTabs = [
      ...this.state.tabs
    ];

    newTabs.splice(currentTabIndex, 1);

    if (newTabs.length === 0) {
      newTabs = [
        {
          name: null,
          uuid: uuid.v1(),
          headers: {},
          endpoint: '',
          method: 'post'
        }
      ];
    }

    this.setState({
      tabs: newTabs,
      currentTabIndex: gotoTabIndex
    }, () => {
      this.updateLocalStorage();
    });
  }

  gotoNextTab() {
    let nextTab = this.state.currentTabIndex + 1;
    if (nextTab >= this.state.tabs.length) {
      nextTab = 0;
    }
    this.setState({
      currentTabIndex: nextTab
    }, () => {
      this.updateLocalStorage();
    });
  }

  gotoPreviousTab() {
    let prevTab = this.state.currentTabIndex - 1;
    if (prevTab < 0) {
      prevTab = this.state.tabs.length - 1;
    }
    this.setState({
      currentTabIndex: prevTab
    }, () => {
      this.updateLocalStorage();
    });
  }

  exportQuery() {
    const queryText = this.graphiql.getQueryEditor().getValue();
    const variablesText = this.graphiql.getVariableEditor().getValue();
    const variables = variablesText ? JSON.parse(variablesText) : undefined;
    const queryObj = {
      query: queryText,
      variables
    };
    this.copyToClipboard(JSON.stringify(queryObj, null, 2));
  }

  copyToClipboard(text) {
    const span = document.createElement('span');
    span.style.whiteSpace = 'pre';
    span.textContent = text;
    const selection = window.getSelection();
    document.body.appendChild(span);

    const range = document.createRange();
    selection.removeAllRanges();
    range.selectNode(span);
    selection.addRange(range);

    document.execCommand('copy');

    selection.removeAllRanges();
    span.remove();
  }

  getCurrentTab() {
    return this.state.tabs[this.state.currentTabIndex];
  }

  updateLocalStorage() {
    window.localStorage.setItem('tabs', JSON.stringify(this.state.tabs));
    window.localStorage.setItem('currentTabIndex', this.state.currentTabIndex);
  }

  graphQLFetcher = (graphQLParams) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'graphiql-app'
    };

    const error = {
                    "data" : null,
                    "errors": [
                      {
                        "message": "I couldn't communicate with the GraphQL server at the provided URL. Is it correct?"
                      }
                    ]
                  };

    const { endpoint, method, headers } = this.getCurrentTab();

    if (endpoint == "") {
      return Promise.resolve({
        "data" : null,
        "errors": [
          {
            "message": "Provide a URL to a GraphQL endpoint to start making queries to it!"
          }
        ]
      });
    }

    const requestHeaders = Object.assign({}, defaultHeaders, headers);
    const url = new URL(endpoint);

    if (method == "get") {
      if (typeof graphQLParams['variables'] === "undefined"){
        graphQLParams['variables'] = "{}";
      }

      const query = encodeURIComponent(graphQLParams['query']);
      const variables = encodeURIComponent(JSON.stringify(graphQLParams['variables']));

      url.search = `query=${query}&variables=${variables}`;
    }

    const requestOptions = {
      method,
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: requestHeaders,
      rejectUnauthorized: false, // avoid problems with self-signed certs
    };

    const request = url.protocol === 'https:' ? httpsRequest(requestOptions) : httpRequest(requestOptions);

    return new Promise((resolve, reject) => {
      request.on('response', response => {
        const chunks = [];
        response.on('data', data => {
          chunks.push(Buffer.from(data));
        });
        response.on('end', end => {
          const data = Buffer.concat(chunks).toString();
          if (response.statusCode >= 400) {
            reject(data);
          } else {
            resolve(JSON.parse(data));
          }
        });
      });

      request.on('error', reject);

      if (method == "get") {
        request.end();
      } else {
        request.end(JSON.stringify(graphQLParams));
      }
    })
  }

  handleChange(field, eOrKey, e) {
    if (typeof eOrKey === 'number') {
      this.updateFieldForTab(eOrKey, field, e.target.value);
    } else {
      this.updateFieldForTab(this.state.currentTabIndex, field, eOrKey.target.value);
    }
  }

  updateFieldForTab(tabIndex, field, value) {
    const { tabs } = this.state;

    const newTabs = [...tabs];

    newTabs[tabIndex] = {
      ...tabs[tabIndex],
      [field]: value
    };

    this.setState({
      tabs: newTabs
    }, () => {
      this.updateLocalStorage();
    });
  }

  handleTabClick = (tabIndex) => {
    if (tabIndex !== this.state.editingTab) {
      this.setState({
        currentTabIndex: tabIndex,
        editingTab: null
      });
    }
  }

  handleTabDoubleClick = (tabIndex) => {
    this.setState({
      editingTab: tabIndex
    }, () => {
      ReactDOM.findDOMNode(this.refs.editingTabNameInput).focus();
    });
  }

  handleEditTabKeyUp = (e) => {
    if(e.keyCode === 13) {
      this.setState({
        editingTab: null
      });
    }
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
    this.updateFieldForTab(this.state.currentTabIndex, 'headers', headers);
  }

  render() {
    const currentTab = this.getCurrentTab();

    const { currentTabIndex } = this.state;
    const tabEl = (
      <div key={currentTabIndex} className="tabs__tab">
        <form className="pure-form">
          <div className="fieldset">
            <div className="pure-control-group">
              <label htmlFor="endpoint">GraphQL Endpoint</label>
              <input type="text" className="pure-input-1-2" name="endpoint" value={currentTab.endpoint} onChange={this.handleChange.bind(this, 'endpoint')} placeholder="GraphQL Endpoint" />

              <a href="javascript:;" className="pure-button pure-button-primary edit-headers-button" onClick={this.openHeaderEdit}>Edit HTTP Headers</a>

              <div className="pure-control-group" style={{float: 'right'}}>
                <label htmlFor="method">Method</label>

                <select name="method" value={currentTab.method} onChange={this.handleChange.bind(this, 'method')}>
                  <option value="get">GET</option>
                  <option value="post">POST</option>
                </select>
              </div>
            </div>
          </div>
        </form>
        <div className="graphiql-wrapper">
          {
            // THIS IS THE GROSSEST THING I'VE EVER DONE AND I HATE IT. FIXME ASAP
          }
          <GraphiQL
            ref={graphiql => this.graphiql = graphiql}
            key={currentTabIndex + currentTab.endpoint + JSON.stringify(currentTab.headers)}
            storage={getStorage(`graphiql:${currentTab.uuid}`)}
            fetcher={this.graphQLFetcher} />
        </div>
      </div>
    );

    return (
      <div className="wrapper">
        <div className="tab-bar">
          <div className="tab-bar-inner">
            {_.map(this.state.tabs, (tab, tabIndex) => {
              return (
                <li
                  key={tabIndex}
                  className={tabIndex === this.state.currentTabIndex ? 'active' : ''}>
                  <a href="javascript:;"
                    onClick={this.handleTabClick.bind(this, tabIndex)}
                    onDoubleClick={this.handleTabDoubleClick.bind(this, tabIndex)}>
                    { this.state.editingTab === tabIndex ?
                      <input ref="editingTabNameInput"
                        type="text"
                        value={tab.name || ''}
                        onKeyUp={this.handleEditTabKeyUp}
                        onChange={this.handleChange.bind(this, 'name', tabIndex)} />
                      : tab.name || `Untitled Query ${tabIndex + 1}` }
                  </a>
                </li>
              );
            })}
          </div>
        </div>
        <div className="tabs">
          {tabEl}
        </div>
        <Modal isOpen={this.state.headerEditOpen} onRequestClose={this.closeModal}>
          <HTTPHeaderEditor
            headers={_.map(this.state.tabs[this.state.currentTabIndex].headers, (value, key) => ({ key, value }))}
            onCreateHeaders={this.getHeadersFromModal}
            closeModal={this.closeModal} />
        </Modal>
      </div>
    );
  }
}

const _storages = {};

function _makeStorage(storageKey) {
  return {
    setItem: (key, val) => window.localStorage.setItem(`${storageKey}${key}`, val),
    getItem: (key) => window.localStorage.getItem(`${storageKey}${key}`),
    removeItem: (key) => window.localStorage.removeItem(`${storageKey}${key}`)
  };
}

function getStorage(storageKey) {
  if (!_storages[storageKey]) {
    _storages[storageKey] = _makeStorage(storageKey);
  }
  return _storages[storageKey];
}
