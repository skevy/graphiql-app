// webpack.config.js
var path = require("path");
const projectRoot = path.join(__dirname, "..");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = [
  {
    mode: "production",
    entry: "./app/mainApp.jsx",
    target: "electron-main",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.js(x?)$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.js\.flow/,
          use: ["file-loader"],
        },
      ],
    },
    plugins: [new MiniCssExtractPlugin()],
    resolve: {
      modules: [__dirname + "../app", "node_modules"],
      extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
      fallback: {
        crypto: require.resolve("crypto-browserify"),
      },
    },
    output: {
      path: path.join(projectRoot, "dist"),
      filename: "bundle.js",
      libraryTarget: "commonjs2",
      publicPath: "/dist/",
    },
  },
];
