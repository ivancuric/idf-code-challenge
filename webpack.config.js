const fs = require('fs-extra');
const webpack = require('webpack');
const NameAllModulesPlugin = require('name-all-modules-plugin');
const md5 = require('md5');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const WebpackNotifierPlugin = require('webpack-notifier');
const CleanObsoleteChunks = require('webpack-clean-obsolete-chunks');
const InterpolateLoaderOptionsPlugin = require('interpolate-loader-options-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const fixSvgDimensions = require('./_scripts/svg-dimension');
const paths = require('./_scripts/paths');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const outputPath = isProd ? paths.temp : paths.dist;

const getManifestPath = () => outputPath.root + 'manifest.json';

if (!fs.existsSync(getManifestPath())) {
  fs.outputJsonSync(getManifestPath(), {});
}

const getSvgoPlugins = () => [
  { removeAttrs: { attrs: ['data-name'] } },
  { removeTitle: true },
  { removeXMLNS: true },
  { addClassesToSVGElement: { classNames: ['svg', '[name]'] } },
  {
    addAttributesToSVGElement: {
      attribute: 'aria-hidden="true"',
    },
  },
];

const configureSvgLoader = () => ({
  test: /\.svg$/,
  use: [
    {
      loader: 'raw-loader',
    },
    {
      loader: 'skeleton-loader',
      options: {
        procedure(content) {
          return fixSvgDimensions(content);
        },
      },
    },
    {
      loader: 'svgo-loader',
      options: {
        plugins: getSvgoPlugins(),
      },
    },
  ],
});

const configureBabelLoader = browserlist => ({
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: isProd ? false : true,
      presets: [
        [
          'env',
          {
            debug: false,
            modules: false,
            useBuiltIns: true,
            // exclude: ['transform-regenerator'],
            targets: {
              browsers: browserlist,
            },
          },
        ],
      ],
      plugins: [
        'transform-object-rest-spread',
        'transform-class-properties',
        'syntax-dynamic-import',
        // 'babel-plugin-async-to-promises',
      ],
    },
  },
});

const basePlugins = () =>
  [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
    !isProd && new CleanObsoleteChunks(),
    !isProd && new WebpackNotifierPlugin(),
    new InterpolateLoaderOptionsPlugin({
      loaders: [
        {
          name: 'svgo-loader',
          include: ['plugins.3.addClassesToSVGElement.classNames.1'],
        },
      ],
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.NamedChunksPlugin(
      chunk =>
        chunk.name
          ? chunk.name
          : md5(chunk.mapModules(m => m.identifier()).join()).slice(0, 10),
    ),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity,
    }),
    new NameAllModulesPlugin(),
    new ManifestPlugin({
      fileName: getManifestPath(),
      seed: JSON.parse(fs.readFileSync(getManifestPath(), 'utf8')),
    }),
  ].filter(Boolean);

const prodPlugins = () => [
  new webpack.optimize.ModuleConcatenationPlugin(),
  new UglifyJSPlugin({
    parallel: true,
    sourceMap: true,
    uglifyOptions: {
      mangle: {
        // Works around a Safari 10 bug:
        // https://github.com/mishoo/UglifyJS2/issues/1753
        safari10: true,
      },
    },
  }),
];

const baseConfig = {
  resolve: {
    modules: ['node_modules', paths.src.svg, paths.src.js],
  },
  output: {
    path: outputPath.js,
    publicPath: paths.staticPath + '/js/',
    filename: '[name]-[chunkhash:10].js',
  },
  cache: isProd ? false : {},
  devtool: isProd ? 'source-map' : 'cheap-module-source-map',
  plugins: isProd ? [...basePlugins(), ...prodPlugins()] : basePlugins(),
  performance: {
    hints: isProd ? 'warning' : false,
  },
};

const legacyConfig = Object.assign({}, baseConfig, {
  entry: {
    images: paths.src.js + 'images.js',
    widget: paths.src.js + 'widget.js',
  },
  module: {
    rules: [
      configureBabelLoader(['last 1 Chrome versions']),
      configureSvgLoader(),
    ],
  },
});

module.exports = legacyConfig;
