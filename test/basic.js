require('./global-setup');

describe('Basic Test', function () {
  this.timeout(10000);

  it('opens a window', function () {
    return this.app.client.waitUntilWindowLoaded()
        .getWindowCount().should.eventually.equal(1);
  });
});
