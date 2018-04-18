// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
const path = require('path');
module.exports = function (config) {
  config.set({
    basePath: 'src',
    exclude: ['test/**'],
    frameworks: ['mocha', 'chai', 'sinon-chai', '@angular/cli'],
    plugins: [
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-sinon'),
      require('karma-sinon-chai'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-phantomjs-launcher'),
      require('karma-mocha-reporter'),
//      require('karma-coverage'),
      require('karma-coverage-istanbul-reporter'),
//      require('karma-istanbul-threshold'),
      require('@angular/cli/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },

    coverageIstanbulReporter: {
      dir:path.join(__dirname, 'coverage','karma'),
      reports: ['json'],
      fixWebpackSourcePaths: true,
      skipFilesWithNoCoverage: true
    },
    // optionally, configure the reporter
/*
    coverageReporter: {
      dir:'coverage',
      //reporters: [{type: 'json'}]
      type:'json-summary'
    },
*/
    angularCli: {
      config: './angular-cli.json',
      environment: 'dev'
    },
    port: 9876,
    proxies: {
      "/api": "http://localhost:4500/api"
    },
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false,
    preprocessors: {
      './src/app/test.ts': ['@angular/cli']

    },
    reporters: ['mocha', 'progress', 'coverage-istanbul'],
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    },
  });
};
