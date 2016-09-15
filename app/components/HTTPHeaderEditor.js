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
          <button onClick={() => this.editRow(i)}>Edit</button>
          <button onClick={() => this.removeRow(i)}>&times;</button>
        </td>
      </tr>
    )
  }

  editingRow(header, i) {
    return (
      <tr key={`editing-row-${i}`}>
        <td>
          <input
            ref={(c) => (this[`editingRow${i}KeyInput`] = c)}
            type="text"
            placeholder="Header Key"
            defaultValue={header.key}
            style={{ width: '100%' }}
          />
        </td>
        <td>
          <input
            ref={(c) => (this[`editingRow${i}ValueInput`] = c)}
            type="text"
            placeholder="Header Value"
            defaultValue={header.value}
            style={{ width: '100%' }}
          />
        </td>
        <td>
          <button onClick={() => this.completeEdit(i)}>&#x2713;</button>
          <button onClick={() => this.cancelEdit(i)}>&times;</button>
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
            <input
              ref={(c) => (this.newKeyInput = c)}
              type="text"
              placeholder="Header Key"
              style={{ width: '100%' }}
            />
          </td>
          <td>
            <input
              ref={(c) => (this.newValInput = c)}
              type="text"
              placeholder="Header Value"
              style={{ width: '100%' }}
            />
          </td>
          <td>
            <button onClick={this.completeAdd}>&#x2713;</button>
            <button onClick={this.cancelAdd}>&times;</button>
          </td>
        </tr>
      )
    }

    return (
      <div className="headerEditor">
        <h2>Edit HTTP Headers</h2>
        <div>
          <a href="javascript:;" onClick={this.addHeader}>+ Add Header</a>
          <table className="pure-table pure-table-striped" style={styles.table}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
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
