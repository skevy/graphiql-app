import './app.css';
import 'graphiql/graphiql.css';

import 'mousetrap';

(function(Mousetrap) {
    var _globalCallbacks = {};
    var _originalStopCallback = Mousetrap.prototype.stopCallback;

    Mousetrap.prototype.stopCallback = function(e, element, combo, sequence) {
        var self = this;

        if (self.paused) {
            return true;
        }

        if (_globalCallbacks[combo] || _globalCallbacks[sequence]) {
            return false;
        }

        return _originalStopCallback.call(self, e, element, combo);
    };

    Mousetrap.prototype.bindGlobal = function(keys, callback, action) {
        var self = this;
        self.bind(keys, callback, action);

        if (keys instanceof Array) {
            for (var i = 0; i < keys.length; i++) {
                _globalCallbacks[keys[i]] = true;
            }
            return;
        }

        _globalCallbacks[keys] = true;
    };

    Mousetrap.init();
}) (window.Mousetrap);


import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';

const app = ReactDOM.render(<App />, document.getElementById('react-root'));

const ipcRenderer = window.require('electron').ipcRenderer;

ipcRenderer.on('handleElectronMenuOption', function(event, option) {
  app.handleElectronMenuOption(option);
});
