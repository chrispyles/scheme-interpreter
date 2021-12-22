const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = function(_env, argv) {
  const isProduction = argv.mode === "production";
  const isDevelopment = !isProduction;

  return {
    devtool: isDevelopment && "cheap-module-source-map",
    entry: "./client/index.js",
    resolve: {
      extensions: ["*", ".js", ".jsx"],
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "assets/js/main.js",
      publicPath: "/",
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              envName: isProduction ? "production" : "development",
            }
          },
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            "css-loader",
          ]
        },
        {
          test: /\.s[ac]ss$/,
          use: [
              "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 2
              },
            },
            "resolve-url-loader",
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      isProduction &&
        new MiniCssExtractPlugin({
          filename: "assets/css/[name].css",
          chunkFilename: "assets/css/[name].chunk.css"
        }),
        new HtmlWebpackPlugin({
          template: path.resolve(__dirname, "public/index.html"),
          inject: false,
        }),
        new CopyWebpackPlugin({
          patterns: [
            { from: "static" },
          ],
        }),
    ].filter(Boolean),
    devServer: {
      compress: true,
      historyApiFallback: true,
      open: true,
      client: { overlay: true },
    },
  };
};
