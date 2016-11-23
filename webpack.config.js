var path = require('path')
var webpack = require('webpack')
var webpackTargetElectronRenderer = require('webpack-target-electron-renderer')

var options = {
    // devtool: 'eval-source-map',
    entry: {
        vendor: [
            'react',
            'react-dom',
            'react-router'
        ],
        main: [
            './src/index.jsx'
        ]
    },
    output: {
        filename: "main.js",
        path: './dist'
    },
    resolve: {
        root: path.resolve(__dirname) + '/src',
        extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
    },
    module: {
        loaders: [
            {
                test: /\.json/,
                loader: require.resolve('json-loader')
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: require.resolve('babel-loader'),
                query: {
                    presets: [
                        require.resolve('babel-preset-es2015'),
                        require.resolve('babel-preset-react')
                    ],
                    plugins: [
                        require.resolve('babel-plugin-transform-class-properties')
                    ]
                }
            }
        ]
    },
    plugins: [
        new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en|nl)$/),
        new webpack.optimize.CommonsChunkPlugin({
            names: ['vendor'],
            filename: "[name].js"
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ]
}

options.target = webpackTargetElectronRenderer(options)

module.exports = options 
