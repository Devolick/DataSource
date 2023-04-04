const path = require("path");
const config = require("./webpack.config");

module.exports = {
  ...config,
  optimization: {
    minimize: true,
  },
  output: {
    ...config.output,
    clean: false,
    filename: "datasource.min.js",
  },
};
