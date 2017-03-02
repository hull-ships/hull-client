const path = require("path");
const webpack = require("webpack");

let plugins = [];

if (process.env.NODE_ENV === "production") {
  plugins = [
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
        screw_ie8: false
      }
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ];
}

module.exports = {
  devtool: "#source-map",
  entry: {
    admin: path.join(__dirname, "src/admin.js"),
    ship: path.join(__dirname, "src/ship.js"),
  },
  output: {
    path: path.join(__dirname, "/dist/"),
    filename: "[name].js",
    publicPath: "/"
  },
  plugins,
  resolve: { extensions: [".js"] },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: "style-loader",
            options: { singleton: true }
          },
          {
            loader: "css-loader",
            options: { modules: true, importLoaders: 1 }
          },
        ]
      },
      {
        test: /\.svg$/,
        use: [{
          loader: "svg-inline-loader"
        }]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
};
