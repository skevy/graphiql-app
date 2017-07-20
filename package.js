/* eslint no-shadow: 0, func-names: 0, no-unused-vars: 0, no-console: 0 */
var os = require('os');
var webpack = require('webpack');
var cfg = require('./webpack/webpack.config.production.js');
var packager = require('electron-packager');
var assign = require('object-assign');
var del = require('del');
var latest = require('github-latest-release');
var argv = require('minimist')(process.argv.slice(2));
var devDeps = Object.keys(require('./package.json').devDependencies);


var appName = argv.name || argv.n || 'ElectronReact';
var shouldUseAsar = argv.asar || argv.a || false;
var shouldBuildAll = argv.all || false;
var shouldPrune = argv.prune || true;

var DEFAULT_OPTS = {
  dir: './',
  name: appName,
  asar: shouldUseAsar,
  prune: shouldPrune,
  ignore: [
    '/test($|/)',
    '/tools($|/)',
    '/release($|/)'
  ].concat(devDeps.map(function(name) { return '/node_modules/' + name + '($|/)'; }))
};

var icon = argv.icon || argv.i || 'app/app.icns';

if (icon) {
  DEFAULT_OPTS.icon = icon;
}

var version = argv.version || argv.v;

if (version) {
  DEFAULT_OPTS.version = version;
  startPack();
} else {
  latest('atom', 'electron', function(err, res) {
    if (err) {
      console.error("Error while fetching latest Electron release: " + err.message + "\n");
      DEFAULT_OPTS.version = '0.28.3';
    } else {
      DEFAULT_OPTS.version = res.name.split('v')[1];
    }
    startPack();
  });
}


function startPack() {
  console.log('start pack...');
  webpack(cfg, function runWebpackBuild(err, stats) {
    if (err) return console.error(err);
    del('release')
    .then(function(paths) {
      if (shouldBuildAll) {
        // build for all platforms
        var archs = ['ia32', 'x64'];
        var platforms = ['linux', 'win32', 'darwin'];

        platforms.forEach(function(plat) {
          archs.forEach(function(arch) {
            pack(plat, arch, log(plat, arch));
          });
        });
      } else {
        // build for current platform only
        pack(os.platform(), os.arch(), log(os.platform(), os.arch()));
      }
    })
    .catch(function(err) {
      console.error(err);
    });
  });
}

function pack(plat, arch, cb) {
  // there is no darwin ia32 electron
  if (plat === 'darwin' && arch === 'ia32') return;

  var opts = assign({}, DEFAULT_OPTS, {
    platform: plat,
    arch: arch,
    out: 'release/' + plat + '-' + arch
  });

  packager(opts, cb);
}


function log(plat, arch) {
  return function(err, filepath) {
    if (err) return console.error(err);
    console.log(plat + '-' + arch + ' finished!');
  };
}
