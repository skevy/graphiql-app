var Application = require('spectron').Application;
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var path = require('path');

global.before(function () {
  chai.should();
  chai.use(chaiAsPromised);
});

beforeEach(function () {
  this.app = new Application({
      path: require('electron-prebuilt'),
      args: [path.join(__dirname, '../')]
  });
  this.app.start();

  return this.app.start().then(function (app) {
    chaiAsPromised.transferPromiseness = app.transferPromiseness;
    return app;
  });
});

afterEach(function () {
  if (this.app && this.app.isRunning()) {
    return this.app.stop();
  }
});
