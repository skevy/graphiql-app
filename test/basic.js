require('./global-setup');

describe('Basic Test', function () {
  it('opens a window', function () {
    return this.app.client.waitUntilWindowLoaded()
        .getWindowCount().should.eventually.equal(1);
  });
});
