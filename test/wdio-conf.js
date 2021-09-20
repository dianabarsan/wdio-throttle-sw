const http = require('http');
const port = process.env.PORT || 8265;

exports.config = {
  runner: 'local',
  specs: [ 'test/*.spec.js',],
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
  }],
  baseUrl: `http://localhost:${port}`,
  logLevel: 'info',
  outputDir: __dirname,
  waitForTimeout: 1000000,
  connectionRetryTimeout: 120000,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 70000,
  },
  onComplete: (exitcode, config) => {
    http.get(`${config.baseUrl}/stop`);
  },
}
