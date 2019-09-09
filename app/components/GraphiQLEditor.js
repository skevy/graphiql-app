import React, { Component } from "react";
import GraphiQL from "graphiql";
import GraphiQLExplorer from "graphiql-explorer";
import { buildClientSchema, getIntrospectionQuery, parse } from "graphql";

import "graphiql/graphiql.css";

class App extends Component {
  _graphiql: GraphiQL;

  constructor(props) {
    super(props);
    const explorerIsOpen = JSON.parse(this.props.storage.getItem("graphiql:explorerIsOpen") || "false");
    const firstQuery = ((JSON.parse(this.props.storage.getItem("graphiql:queries") || "{}")["queries"]||[])[0] || {}).query;
    this.state = { schema: null, query: firstQuery, explorerIsOpen: explorerIsOpen};
  }

  componentDidMount() {
    this.props.fetcher({
      query: getIntrospectionQuery()
    }).then(result => {
      const editor = this._graphiql.getQueryEditor();
      editor.setOption("extraKeys", {
        ...(editor.options.extraKeys || {}),
        "Shift-Alt-LeftClick": this._handleInspectOperation
      });

      if (result.data) {
        this.setState({ schema: buildClientSchema(result.data) });
      };
    });
  }

  _handleInspectOperation = (
    cm,
    mousePos
  ) => {
    const parsedQuery = parse(this.state.query || "");

    if (!parsedQuery) {
      console.error("Couldn't parse query document");
      return null;
    }

    var token = cm.getTokenAt(mousePos);
    var start = { line: mousePos.line, ch: token.start };
    var end = { line: mousePos.line, ch: token.end };
    var relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end)
    };

    var position = relevantMousePos;

    var def = parsedQuery.definitions.find(definition => {
      if (!definition.loc) {
        console.log("Missing location information for definition");
        return false;
      }

      const { start, end } = definition.loc;
      return start <= position.start && end >= position.end;
    });

    if (!def) {
      console.error(
        "Unable to find definition corresponding to mouse position"
      );
      return null;
    }

    var operationKind =
      def.kind === "OperationDefinition"
        ? def.operation
        : def.kind === "FragmentDefinition"
        ? "fragment"
        : "unknown";

    var operationName =
      def.kind === "OperationDefinition" && !!def.name
        ? def.name.value
        : def.kind === "FragmentDefinition" && !!def.name
        ? def.name.value
        : "unknown";

    var selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

    var el = document.querySelector(selector);
    el && el.scrollIntoView();
  }

  _handleEditQuery = (query) => this.setState({ query });

  _handleToggleExplorer = () => {
    const explorerIsOpen = !this.state.explorerIsOpen;
    this.props.storage.setItem("graphiql:explorerIsOpen", JSON.stringify(!this.state.explorerIsOpen));
    this.setState({ explorerIsOpen: explorerIsOpen });
  };

  render() {
    console.log("State stuff: ", this.state, this.props);
    const { query, schema } = this.state;
    console.log("GraphiQL state: ", this.state);
    return (
      <div className="graphiql-container">
        <GraphiQLExplorer
          schema={schema}
          query={query}
          onEdit={this._handleEditQuery}
          onRunOperation={operationName =>
            this._graphiql.handleRunQuery(operationName)
          }
          explorerIsOpen={this.state.explorerIsOpen}
          onToggleExplorer={this._handleToggleExplorer}
        />
        <GraphiQL
          ref={ref => (this._graphiql = ref)}
          fetcher={this.props.fetcher}
          schema={schema}
          onEditQuery={this._handleEditQuery}
          storage={this.props.storage}
          query={this.state.query}
        >
          <GraphiQL.Toolbar>
            <GraphiQL.Button
              onClick={() => this._graphiql.handlePrettifyQuery()}
              label="Prettify"
              title="Prettify Query (Shift-Ctrl-P)"
            />
            <GraphiQL.Button
              onClick={() => this._graphiql.handleToggleHistory()}
              label="History"
              title="Show History"
            />
            <GraphiQL.Button
              onClick={this._handleToggleExplorer}
              label="Explorer"
              title="Toggle Explorer"
            />
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    );
  }
}

export default App;
