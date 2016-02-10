/*global Mousetrap*/
import _ from 'lodash';
import React from 'react';
import fetch from 'isomorphic-fetch';
import GraphiQL from 'graphiql/dist';
import Modal from 'react-modal/lib/index';

Modal.setAppElement(document.getElementById('react-root'));
Modal.injectCSS();

import HTTPHeaderEditor from './HTTPHeaderEditor';


export default class App extends React.Component {
  constructor() {
    super();

    const storage = window.localStorage;

    this.state = {
      headerEditOpen: false,
      currentTabKey: storage.getItem('currentTab') ? parseInt(storage.getItem('currentTab')) : 0,
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
    }
  }

  createNewTab() {
    const currentTab = this.getCurrentTab();
    const newTabKey = this.state.tabs.length;

    this.setState({
      tabs: [...this.state.tabs, {
        headers: currentTab.headers,
        endpoint: currentTab.endpoint,
        method: currentTab.method
      }],
      currentTabKey: newTabKey
    }, () => {
      this.updateLocalStorage();
    });
  }

  closeCurrentTab() {
    const currentTabKey = this.state.currentTabKey;
    let gotoTabKey = currentTabKey - 1;
    if (currentTabKey === 0) {
      gotoTabKey = 0;
    }

    let newTabs = [
      ...this.state.tabs
    ];

    newTabs.splice(currentTabKey, 1);

    if (newTabs.length === 0) {
      newTabs = [
        {
          name: null,
          headers: {},
          endpoint: '',
          method: 'post'
        }
      ];
    }

    this.setState({
      tabs: newTabs,
      currentTabKey: gotoTabKey
    }, () => {
      this.updateLocalStorage();
    });
  }

  gotoNextTab() {
    let nextTab = this.state.currentTabKey + 1;
    if (nextTab >= this.state.tabs.length) {
      nextTab = 0;
    }
    this.setState({
      currentTabKey: nextTab
    }, () => {
      this.updateLocalStorage();
    });
  }

  gotoPreviousTab() {
    let prevTab = this.state.currentTabKey - 1;
    if (prevTab < 0) {
      prevTab = this.state.tabs.length - 1;
    }
    this.setState({
      currentTabKey: prevTab
    }, () => {
      this.updateLocalStorage();
    });
  }

  getCurrentTab() {
    return this.state.tabs[this.state.currentTabKey];
  }

  updateLocalStorage() {
    window.localStorage.setItem('tabs', JSON.stringify(this.state.tabs));
    window.localStorage.setItem('currentTab', this.state.currentTabKey);
  }

  graphQLFetcher = (graphQLParams) => {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const { endpoint, method, headers } = this.getCurrentTab();

    if (method == "get") {
      return fetch(endpoint + "?query=" + encodeURIComponent(graphQLParams['query']) + "&variables=" + encodeURIComponent(graphQLParams['variables']), {
        method: method,
        headers: Object.assign({}, defaultHeaders, headers),
        body: null
      }).then(response => response.json());
    }
    return fetch(endpoint, {
      method: method,
      headers: Object.assign({}, defaultHeaders, headers),
      body: JSON.stringify(graphQLParams)
    }).then(response => response.json());
  }

  handleChange(field, eOrKey, e) {
    if (typeof eOrKey === 'number') {
      this.updateFieldForTab(eOrKey, field, e.target.value);
    } else {
      this.updateFieldForTab(this.state.currentTabKey, field, eOrKey.target.value);
    }
  }

  updateFieldForTab(tabKey, field, value) {
    const { tabs } = this.state;

    const newTabs = [...tabs];

    newTabs[tabKey] = {
      ...tabs[tabKey],
      [field]: value
    };

    this.setState({
      tabs: newTabs
    }, () => {
      this.updateLocalStorage();
    });
  }

  handleTabClick = (tabKey) => {
    if (tabKey !== this.state.editingTab) {
      this.setState({
        currentTabKey: tabKey,
        editingTab: null
      });
    }
  }

  handleTabDoubleClick = (tabKey) => {
    this.setState({
      editingTab: tabKey
    }, () => {
      React.findDOMNode(this.refs.editingTabNameInput).focus();
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
    this.updateFieldForTab(this.state.currentTabKey, 'headers', headers);
  }

  render() {
    const currentTab = this.getCurrentTab();

    const { currentTabKey } = this.state;
    const tabEl = (
      <div key={currentTabKey} className="tabs__tab">
        <div className="config-form clearfix">
          <div className="field endpoint-box">
            <label htmlFor="endpoint">GraphQL Endpoint</label>
            <input type="text" name="endpoint"
              value={currentTab.endpoint} onChange={this.handleChange.bind(this, 'endpoint')} />
          </div>
          <div className="field">
            <label htmlFor="method">Method</label>
            <select name="method" value={currentTab.method} onChange={this.handleChange.bind(this, 'method')}>
              <option value="get">GET</option>
              <option value="post">POST</option>
            </select>
          </div>
          <div className="field headers">
            <a href="javascript:;" onClick={this.openHeaderEdit}>Edit HTTP Headers</a>
          </div>
        </div>
        <div className="graphiql-wrapper">
          {
            // THIS IS THE GROSSEST THING I'VE EVER DONE AND I HATE IT. FIXME ASAP
          }
          <GraphiQL
            key={currentTabKey + currentTab.endpoint + JSON.stringify(currentTab.headers)}
            storage={getStorage(`graphiql:${currentTabKey}`)}
            fetcher={this.graphQLFetcher} />
        </div>
      </div>
    );

    return (
      <div className="wrapper">
        <div className="tab-bar">
          <div className="tab-bar-inner">
            {_.map(this.state.tabs, (tab, tabKey) => {
              return (
                <li
                  key={tabKey}
                  className={tabKey === this.state.currentTabKey ? 'active' : ''}>
                  <a href="javascript:;"
                    onClick={this.handleTabClick.bind(this, tabKey)}
                    onDoubleClick={this.handleTabDoubleClick.bind(this, tabKey)}>
                    { this.state.editingTab === tabKey ?
                      <input ref="editingTabNameInput"
                        type="text"
                        value={tab.name}
                        onKeyUp={this.handleEditTabKeyUp}
                        onChange={this.handleChange.bind(this, 'name', tabKey)} />
                      : tab.name || `Untitled Query ${tabKey + 1}` }
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
            headers={_.map(this.state.tabs[this.state.currentTabKey].headers, (value, key) => ({ key, value }))}
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
    getItem: (key) => window.localStorage.getItem(`${storageKey}${key}`)
  };
}

function getStorage(storageKey) {
  if (!_storages[storageKey]) {
    _storages[storageKey] = _makeStorage(storageKey);
  }
  return _storages[storageKey];
}
