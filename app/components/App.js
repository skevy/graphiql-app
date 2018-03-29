/*global Mousetrap*/
import _ from 'lodash';
import uuid from 'uuid';
import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql/dist';
import Modal from 'react-modal/lib/index';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import {
  buildClientSchema,
  introspectionQuery,
  isType,
  GraphQLObjectType,
} from 'graphql'

Modal.setAppElement(document.getElementById('react-root'));

import HTTPHeaderEditor from './HTTPHeaderEditor';


export default class App extends React.Component {
  constructor() {
    super();

    const storage = window.localStorage;

    this._eventSource = {}
    this._debouncedUpdateSchema = {};
    let tabs;
    try {
      tabs = JSON.parse(storage.getItem('tabs')).map(t => {
        return Object.assign({
          uuid: uuid.v1(),
        }, t);
      });
      if (tabs.length < 1) {
        throw new Error("Fallback");
      }
    } catch (e) {
      tabs = [
        {
          uuid: uuid.v1(),
          name: null,
          headers: {},
          endpoint: '',
          method: 'post',
          schema: null,
          streamUrl: null,
        }
      ];
    }

    const currentTabIndex = storage.getItem('currentTabIndex') ? parseInt(storage.getItem('currentTabIndex'), 10) : 0;

    this.state = {
      headerEditOpen: false,
      currentTabIndex: currentTabIndex < tabs.length ? currentTabIndex : 0,
      tabs
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

    const currentTab = this.getCurrentTab();

    this.state.tabs.forEach(t => {
      this.updateSchema(t.uuid);
    });
  }

  componentWillUpdate(nextProps, nextState) {
    const oldTab = this.getCurrentTab();
    const oldSchema = oldTab ? oldTab.schema : null;
    const newTab = nextState.tabs[nextState.currentTabIndex];
    const newSchema = newTab ? newTab.schema : null;
    if (oldSchema !== newSchema) {
      // Do some hacky stuff to GraphiQL.
      console.log(newTab.uuid, "Schema changed, updating GraphiQL");
      this._updateGraphiQLDocExplorerNavStack(newSchema)
    }
  }

  componentDidUpdate(oldProps, oldState) {
    const currentTab = this.getCurrentTab();
    const hash = (tab) => {
      if (!tab) {
        return null;
      }
      const {headers, endpoint, method} = tab
      return JSON.stringify({
        headers,
        endpoint,
        method
      })
    }
    const currentTabPreviousState = oldState.tabs.find(t => t.uuid === currentTab.uuid);
    const oldHash = hash(currentTabPreviousState);
    const newHash = hash(currentTab);
    if (oldHash !== newHash) {
      this.debouncedUpdateSchema(currentTab.uuid);
    } else if (currentTabPreviousState.streamUrl !== currentTab.streamUrl) {
      this.updateEventStream(currentTab.uuid);
    }
    const oldUUIDs = oldState.tabs.map(t => t.uuid).filter(_ => _);
    const newUUIDs = this.state.tabs.map(t => t.uuid).filter(_ => _);
    oldUUIDs.filter(uuid => newUUIDs.indexOf(oldUUIDs) === -1).forEach(uuid => {
      // Clear the event streams of removed tabs
      this.updateEventStream(uuid);
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
      tabs: [...this.state.tabs, Object.assign({}, currentTab, {
        uuid: uuid.v1(),
      })],
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

  getTab(uuid) {
    return this.state.tabs.find(t => t.uuid === uuid);
  }

  updateLocalStorage() {
    window.localStorage.setItem('tabs', JSON.stringify(this.state.tabs.map(t => {
      const { uuid, endpoint, method, headers, name } = t;
      return { uuid, endpoint, method, headers, name };
    })));
    window.localStorage.setItem('currentTabIndex', this.state.currentTabIndex);
  }

  updateEventStream(tabUUID, backoff = 200) {
    const tab = this.getTab(tabUUID);
    if (this._eventSource[tabUUID]) {
      console.log(tabUUID, 'GraphQL schema monitoring disabled'),
      this._eventSource[tabUUID].close();
      this._eventSource[tabUUID] = null;
    }
    if (tab && tab.streamUrl) {
      try {
        const endpointUrl = new URL(tab.endpoint);
        const streamUrl = new URL(tab.streamUrl, endpointUrl);
        const eventSource = new EventSource(streamUrl);
        if (endpointUrl.host !== streamUrl.host) {
          throw new Error(`Stream and endpoint hosts don't match - '${streamUrl.host}' !== '${endpointUrl.host}'`);
        }

        eventSource.addEventListener(
          'change',
          () => {
            this.updateSchema(tabUUID);
          },
          false,
        );

        eventSource.addEventListener(
          'open',
          () => {
            console.log(tabUUID, 'GraphQL schema monitoring enabled');
            // Reset backoff
            backoff = 200;
          },
          false,
        );

        eventSource.addEventListener(
          'error',
          () => {
            console.log(tabUUID, 'GraphQL schema monitoring error');
            setTimeout(() => {
              this.updateEventStream(tabUUID, Math.min(backoff * 1.2, 30000));
            }, backoff);
          },
          false,
        );

        // Store our event source so we can unsubscribe later.
        this._eventSource[tabUUID] = eventSource
      } catch (e) {
        console.error(e);
      }
    }
  }

  async updateSchema(tabUUID) {
    console.log(tabUUID, "Updating schema: starting...");
    let schema
    try {
      // Fetch the schema using our introspection query and report once that has
      // finished.
      const { data } = await this.graphQLFetcher(tabUUID, { query: introspectionQuery })
      console.log(tabUUID, "Updating schema: data fetched, building schema...");

      // Use the data we got back from GraphQL to build a client schema (a
      // schema without resolvers).
      schema = buildClientSchema(data)
      console.log(tabUUID, "Updating schema: schema built, setting state...");
    } catch (e) {
      console.log(tabUUID, "Updating schema: fetching failed, aborted", e);
      return;
    }

    // Update our tab with the new schema.
    this.updateFieldForTabUuid(tabUUID, 'schema', schema);
    console.log(tabUUID, "Updating schema: complete!");
  }

  debouncedUpdateSchema(tabUUID) {
    if (!this._debouncedUpdateSchema[tabUUID]) {
      this._debouncedUpdateSchema[tabUUID] = _.debounce(() => {
        this.updateSchema(tabUUID);
      }, 500, {
        leading: true,
        trailing: true,
      });
    }
    return this._debouncedUpdateSchema[tabUUID]();
  }

  _updateGraphiQLDocExplorerNavStack(nextSchema) {
    // If one type/field isn’t find this will be set to false and the
    // `navStack` will just reset itself.
    let allOk = true
    let nextNavStack = []
    if (!nextSchema) {
      // No schema - reset everything
      allOk = false;
    } else {
      // Get the documentation explorer component from GraphiQL. Unfortunately
      // for them this looks like public API. Muwahahahaha.
      const { docExplorerComponent } = this.graphiql
      const { navStack } = docExplorerComponent.state

      // Ok, so if you look at GraphiQL source code, the `navStack` is made up of
      // objects that are either types or fields. Let’s use that to search in
      // our new schema for matching (updated) types and fields.
      nextNavStack = navStack.map((navStackItem, i) => {
        // If we are not ok, abort!
        if (!allOk) return null

        // Get the definition from the nav stack item.
        const typeOrField = navStackItem.def

        // If there is no type or field then this is likely the root schema view,
        // or a search. If this is the case then just return that nav stack item!
        if (!typeOrField) {
          return navStackItem
        } else if (isType(typeOrField)) {
          // If this is a type, let’s do some shenanigans...
          // Let’s see if we can get a type with the same name.
          const nextType = nextSchema.getType(typeOrField.name)

          // If there is no type with this name (it was removed), we are not ok
          // so set `allOk` to false and return undefined.
          if (!nextType) {
            allOk = false
            return null
          }

          // If there is a type with the same name, let’s return it! This is the
          // new type with all our new information.
          return { ...navStackItem, def: nextType }
        } else {
          // If you thought this function was already pretty bad, it’s about to get
          // worse. We want to update the information for an object field.
          // Ok, so since this is an object field, we will assume that the last
          // element in our stack was an object type.
          const nextLastType = nextSchema.getType(
            navStack[i - 1] ? navStack[i - 1].name : null,
          )

          // If there is no type for the last type in the nav stack’s name.
          // Panic!
          if (!nextLastType) {
            allOk = false
            return null
          }

          // If the last type is not an object type. Panic!
          if (!(nextLastType instanceof GraphQLObjectType)) {
            allOk = false
            return null
          }

          // Next we will see if the new field exists in the last object type.
          const nextField = nextLastType.getFields()[typeOrField.name]

          // If not, Panic!
          if (!nextField) {
            allOk = false
            return null
          }

          // Otherwise we hope very much that it is correct.
          return { ...navStackItem, def: nextField }
        }
      })
    }

    // This is very hacky but works. React is cool.
    this.graphiql.docExplorerComponent.setState({
      // If we are not ok, just reset the `navStack` with an empty array.
      // Otherwise use our new stack.
      navStack: allOk ? nextNavStack : [],
    })
  }

  graphQLFetcher = (tabUUID, graphQLParams) => {
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

    const { endpoint, method, headers } = this.getTab(tabUUID);

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
        graphQLParams['variables'] = {};
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
        this.updateFieldForTabUuid(tabUUID, 'streamUrl', response.headers['x-graphql-event-stream']);
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

  fetcher = graphQLParams => {
    return this.graphQLFetcher(this.getCurrentTab().uuid, graphQLParams);
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

  updateFieldForTabUuid(tabUUID, field, value) {
    const { tabs } = this.state;
    const tabIndex = tabs.findIndex(t => t.uuid === tabUUID);
    if (tabIndex !== -1) {
      this.updateFieldForTab(tabIndex, field, value);
    }
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
          <GraphiQL
            ref={graphiql => this.graphiql = graphiql}
            key={currentTab.uuid}
            storage={getStorage(`graphiql:${currentTab.uuid}`)}
            fetcher={this.fetcher}
            schema={currentTab.schema} />
        </div>
      </div>
    );

    return (
      <div className="wrapper">
        {
          this.state.tabs.length > 1
          ?
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
          : null
        }
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
