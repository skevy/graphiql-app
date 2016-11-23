const os = require('os')
const webpack = require('webpack')
const cfg = require('./webpack.config.js')
const packager = require('electron-packager')
const del = require('del')
const assign = require('lodash/assign')
const latest = require('github-latest-release')
const argv = require('minimist')(process.argv.slice(2))
const devDeps = Object.keys(require('./package.json').devDependencies)


const appName = argv.name || argv.n || 'GraphiQL'
const shouldUseAsar = argv.asar || argv.a || false
const shouldBuildAll = argv.all || false
const shouldPrune = argv.prune || true

const DEFAULT_OPTS = {
    dir: './',
    name: appName,
    asar: shouldUseAsar,
    prune: shouldPrune,
    ignore: [
        '/test($|/)',
        '/tools($|/)',
        '/release($|/)',
        '/node_modules($|/)'
    ]
}

const icon = argv.icon || argv.i || 'assets/icon.icns'

if (icon) {
    DEFAULT_OPTS.icon = icon
}

const version = argv.version || argv.v

if (version) {
    DEFAULT_OPTS.version = version
    startPack()
} else {
    latest('atom', 'electron', function (err, res) {
        if (err) {
            console.error("Error while fetching latest Electron release: " + err.message + "\n")
            DEFAULT_OPTS.version = '0.28.3'
        } else {
            DEFAULT_OPTS.version = res.name.split('v')[1]
        }
        startPack()
    })
}


function startPack() {
    console.log('start pack...')
    webpack(cfg, function runWebpackBuild(err, stats) {
        if (err) return console.error(err)
        del('release')
            .then(function (paths) {
                if (shouldBuildAll) {
                    // build for all platforms
                    var archs = ['ia32', 'x64']
                    var platforms = ['linux', 'win32', 'darwin']

                    platforms.forEach(function (plat) {
                        archs.forEach(function (arch) {
                            pack(plat, arch, log(plat, arch))
                        })
                    })
                } else {
                    // build for current platform only
                    pack(os.platform(), os.arch(), log(os.platform(), os.arch()))
                }
            })
            .catch(function (err) {
                console.error(err)
            })
    })
}

function pack(plat, arch, cb) {
    // there is no darwin ia32 electron
    if (plat === 'darwin' && arch === 'ia32') return

    var opts = assign({}, DEFAULT_OPTS, {
        platform: plat,
        arch: arch,
        out: 'release/' + plat + '-' + arch
    })

    packager(opts, cb)
}


function log(plat, arch) {
    return function (err, filepath) {
        if (err) return console.error(err)
        console.log(plat + '-' + arch + ' finished!')
    }
}