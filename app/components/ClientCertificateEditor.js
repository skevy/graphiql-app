import React from 'react';

export default class ClientCertificateEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = props.creds || {
      cert: '',
      key: '',
    };
    this.handleOk = this.handleOk.bind(this)
  }

  handleOk = () => {
    if (this.state.cert !== '' && this.state.key !== '') {
      this.props.onSelectCreds(this.state)
    } else {
      this.props.onSelectCreds(null)
    }
  }

  render() {
    return (
      <div className="headerEditor">
        <h2>Edit Client Certificates Credentials</h2>
        <hr />
        <form className="pure-form ">
          <fieldset>
            <div className="pure-control-group">
              <label>Certificate</label>
              <UploadButton value={this.state.cert} placeholder='Certificate' onChange={(filePath) => this.setState({ cert: filePath })} />
            </div>
            <br />
            <div className="pure-control-group">
              <label>Key</label>
              <UploadButton value={this.state.key} placeholder='Key' onChange={(filePath) => this.setState({ key: filePath })} />
            </div>
            <br />
            <button style={{ width: '100%' }} className="pure-button pure-button-primary" type='button' onClick={this.handleOk}>
              Save
            </button>
          </fieldset>
        </form>
      </div>
    );
  }
}


class UploadButton extends React.Component {

  constructor(props) {
    super(props);
    this.onChangeFile = this.onChangeFile.bind(this);
    this.onChangePath = this.onChangePath.bind(this);
    this.state = {
      filePath: props.value || ''
    }
  }

  onChangeFile(event) {
    const file = event.target.files[0];
    if (file) {
      this.onChangePath(file.path)
    }
  }

  onChangePath(filePath) {
    this.setState({ filePath })
    this.props.onChange(filePath)
  }

  render() {
    const { onChange, ...props } = this.props;
    return (
      <div>
        <input onChange={this.onChangeFile} type='file' hidden href="javascript:;" ref={(r) => this.input = r} />
        <input onChange={(e) => this.onChangePath(e.target.value)} placeholder={this.props.placeholder} style={{ width: '100%' }} value={this.state.filePath} />
        <button style={{ width: '100%' }} className="pure-button" type='button' onClick={() => this.input.click()} {...props}>Select File</button>
      </div>
    );
  }
}
