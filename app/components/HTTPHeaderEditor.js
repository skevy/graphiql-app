import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
// import Radium from 'radium';

export default class HTTPHeaderEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      headers: props.headers || [],
      addingHeader: false
    };
  }

  sendHeaderListUpdate() {
    if (this.props.onCreateHeaders) {
      this.props.onCreateHeaders(
        _.zipObject(_.map(this.state.headers, (val) => [val.key, val.value]))
      );
    }
  }

  addHeader = () => {
    this.setState({
      addingHeader: true
    });
  }

  completeAdd = () => {
    this.setState({
      headers: [
        ...this.state.headers,
        {
          key: ReactDOM.findDOMNode(this.newKeyInput).value,
          value: ReactDOM.findDOMNode(this.newValInput).value,
          editing: false
        }
      ]
    }, () => {
      this.setState({
        addingHeader: false
      });
      this.sendHeaderListUpdate();
    });
  }

  cancelAdd = () => {
    this.setState({
      addingHeader: false
    });
  }

  removeRow = (i, event) => {
    const newHeaders = [...this.state.headers];
    newHeaders.splice(i, 1);
    this.setState({
      headers: newHeaders
    }, () => {
      this.sendHeaderListUpdate();
    });
  }

  editRow(i) {
    const newHeaders = [...this.state.headers];
    const header = newHeaders[i];

    header.editing = true;

    this.setState({
      headers: newHeaders
    }, () => {
      this.sendHeaderListUpdate();
    });
  }

  completeEdit(i) {
    const newHeaders = [...this.state.headers];
    const header = newHeaders[i];

    header.key = ReactDOM.findDOMNode(this[`editingRow${i}KeyInput`]).value;
    header.value = ReactDOM.findDOMNode(this[`editingRow${i}ValueInput`]).value;
    header.editing = false;

    this.setState({
      headers: newHeaders
    }, () => {
      this.sendHeaderListUpdate();
    });
  }

  cancelEdit(i) {
    const newHeaders = [...this.state.headers];
    const header = newHeaders[i];

    header.editing = false;

    this.setState({
      headers: newHeaders
    }, () => {
      this.sendHeaderListUpdate();
    });
  }

  completedRow(header, i) {
    return (
      <tr key={i}>
        <td>{header.key}</td>
        <td>{header.value.length > 40 ? header.value.substr(0, 40) + '...' : header.value}</td>
        <td>
          <div className="pure-button-group" style={{float: 'right'}} role={`edit-header-${header.key}-group`} aria-label={`Edit ${header.key}`}>
            <button className="pure-button button-secondary" onClick={() => this.editRow(i)}>Edit</button>
            <button className="pure-button button-error" onClick={() => this.removeRow(i)}>Delete</button>
          </div>
        </td>
      </tr>
    )
  }

  editingRow(header, i) {
    return (
      <tr key={`editing-row-${i}`}>
        <td>
          <form className="pure-form" style={{margin: '0px'}}>
            <input
              ref={(c) => (this[`editingRow${i}KeyInput`] = c)}
              type="text"
              placeholder="Header name"
              defaultValue={header.key}
              style={{ width: '100%' }}
            />
          </form>
        </td>
        <td>
          <form className="pure-form" style={{margin: '0px'}}>
            <input
              ref={(c) => (this[`editingRow${i}ValueInput`] = c)}
              type="text"
              placeholder="Header value"
              defaultValue={header.value}
              style={{ width: '100%' }}
            />
          </form>
        </td>
        <td>
          <div className="pure-button-group" style={{float: 'right'}} role={`edit-header-${header.key}-group`} aria-label={`Edit ${header.key}`}>
            <button className="pure-button button-success" onClick={() => this.completeEdit(i)}>Save</button>
            <button className="pure-button button-error" onClick={() => this.cancelEdit(i)}>Cancel</button>
          </div>
        </td>
      </tr>
    )
  }

  render() {
    let addHeader = null;

    if (this.state.addingHeader) {
      addHeader = (
        <tr>
          <td>
            <form className="pure-form" style={{margin: '0px'}}>
              <input
                ref={(c) => (this.newKeyInput = c)}
                type="text"
                placeholder="Header name"
                style={{ width: '100%' }}
              />
            </form>
          </td>
          <td>
            <form className="pure-form" style={{margin: '0px'}}>
              <input
                ref={(c) => (this.newValInput = c)}
                type="text"
                placeholder="Header value"
                style={{ width: '100%' }}
              />
            </form>
          </td>
          <td>
            <div className="pure-button-group" style={{float: 'right'}} role={`create-new-header-group`} aria-label={`Create new header`}>
              <button className="pure-button button-success" onClick={this.completeAdd}>Save</button>
              <button className="pure-button button-error" onClick={this.cancelAdd}>Cancel</button>
            </div>
          </td>
        </tr>
      )
    }

    return (
      <div className="headerEditor">
        <h2 style={{float: 'left'}}>Edit HTTP Headers</h2>
        <a href="javascript:;" style={{float: 'right', margin: '1.24em'}} onClick={this.addHeader} className="pure-button pure-button-primary">+ Add Header</a>
        <div>
          <table className="pure-table pure-table-horizontal" style={styles.table}>
            <thead>
              <tr>
                <th>Header name</th>
                <th>Header value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
            {this.state.headers.map((header, i) => (
              header.editing
              ? this.editingRow(header, i)
              : this.completedRow(header, i)
            ))}
            {addHeader}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

const styles = {
  table: {
    marginTop: 10,
    width: '100%'
  }
}
