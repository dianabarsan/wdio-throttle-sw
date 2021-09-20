const http = require('http')

exports.config = {
  runner: 'local',
  specs: [ 'test/*.spec.js',],
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
  }],
  baseUrl: 'http://localhost:8265',
  logLevel: 'info',
  outputDir: __dirname,
  waitForTimeout: 1000000,
  connectionRetryTimeout: 120000,
  framework: 'mocha',
  reporters: [ 'dot' ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 70000,
  },
  onComplete: (exitcode, config) => {
    console.log('calling on Complete');
    http.get(`${config.baseUrl}/stop`);
  },
}
