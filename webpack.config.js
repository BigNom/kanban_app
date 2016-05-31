const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const NpmInstallPlugin = require('npm-install-webpack-plugin');
const pkg = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build'),
  style: path.join(__dirname, 'app/main.css')
};

process.env.BABEL_ENV = TARGET;

const common = {
  entry: {
    app: PATHS.app,
    style: PATHS.style
  },
// Add resolve.extensions.
// '' is needed to allow imports without an extension.
// Note the .'s before extensions as it will fail to match without!!!
resolve: {
    extensions: ['', '.js', '.jsx']
},

  output: {
      // Output using entry name
    path: PATHS.build,
    filename: '[name].js'
  },
  module: {
    loaders: [
  // Set up jsx. This accepts js too thanks to RegExp
  {
      test: /\.jsx?$/,
      // Enable caching for improved performance during development
      // It uses default OS directory by default. If you need something
      // more custom, pass a path to it. I.e./ babl?cacheDirectory=<path>
      loaders: ['babel?cacheDirectory'],
      // Parse only aoo files! Withou this it will go through entire project.
      // Inaddition to being slow, that will most likely result in an error.
      include: PATHS.app
        }
    ]
},
plugins: [
    new HtmlWebpackPlugin({
        template: 'node_modules/html-webpack-template/index.ejs',
        title: 'Kanban app',
        appMountId: 'app',
        inject: false
        })
    ]
};

// Default configuration
if(TARGET === 'start' || !TARGET) {
  module.exports = merge(common, {

    devtool: 'eval-source-map',
    devServer: {
      contentBase: PATHS.build,

      historyApiFallback: true,
      hot: true,
      inline: true,
      progress: true,

      // Display only errors to reduce the amount of output.
      stats: 'errors-only',

      // Parse host and port from env so this is easy to customize.
      host: process.env.HOST,
      port: process.env.PORT
    },
    module: {
        loaders: [
            //Define development specific CSS setup
            {
                test: /\.css$/,
                loaders: ['style', 'css'],
                include: PATHS.app
            }
        ]
    },

    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new NpmInstallPlugin({
        save: true // --save
      })
    ]
  });
}

if(TARGET === 'build' || TARGET === 'stats') {
  module.exports = merge(common, {
      entry: {
          vendor: Object.keys(pkg.dependencies).filter(function(v) {
              return v !== 'alt-utils';
          })
      },
      ouput: {
          path: PATHS.build,
          filename: '[name].[chunkhash].js',
          chunkFilename: '[chunkhash].js'
      },
      module: {
          loaders: [
              // Extract CSS during build
              {
              test: /\.css$/,
              loader: ExtractTextPlugin.extract('style', 'css'),
              include: PATHS.app
            }
          ]
      },
      plugins: [
          new CleanPlugin([PATHS.build]),

          // Output extracted CSS to a file
          new ExtractTextPlugin('[name].[chunckhash].css'),
          // Extract vendor and manifest files
          new webpack.optimize.CommonsChunkPlugin({
              names: ['vendor', 'manifest']
          }),
          new webpack.DefinePlugin({
              'process.env.NODE_ENV': '"production"'
          }),
          new webpack.optimize.UglifyJsPlugin({
              compress: {
                  warnings: false
              }
          })
      ]
  });
}
