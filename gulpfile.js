const assets = require('postcss-assets');
const autoprefixer = require('autoprefixer');
const bs = require('browser-sync').create();
const cssnano = require('cssnano');
const data = require('gulp-data');
const flexbugs = require('postcss-flexbugs-fixes');
const fs = require('fs-extra');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const inlineSvg = require('postcss-inline-svg');
const mqpacker = require('css-mqpacker');
const notify = require('gulp-notify');
const flatmap = require('gulp-flatmap');
const path = require('path');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const rev = require('gulp-rev');
const rename = require('gulp-rename');
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const sourcemaps = require('gulp-sourcemaps');
const SVGO = require('svgo');
const template = require('gulp-template');
const watch = require('gulp-watch');
const waitOn = require('wait-on');
const notifier = require('node-notifier');
const opn = require('opn');
const { promisify } = require('util');

const fixSvgDimensions = require('./_scripts/svg-dimension');

// Paths
const paths = require('./_scripts/paths');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const outputPath = isProd ? paths.temp : paths.dist;


const bsInit = promisify(bs.init);

// generic gulp error handler
const errorHandler = notify.onError(error => `Error: ${error.message}`);

// sass configuration
const sassConfig = { includePaths: ['./node_modules/'] };

// svgo settings
const coreSvgoPlugins = [
  { removeAttrs: { attrs: ['data-name'] } },
  { removeTitle: true },
];

// runs svg through svgo
const optimizeSvg = (svgString, plugins) => {
  const svgo = new SVGO({ plugins });

  let optimizedSvg;
  svgo.optimize(svgString, output => (optimizedSvg = output.data));
  return optimizedSvg;
};

// get svg in template (requires svgo 0.72 due to the lack of a Promise support)
const getSvg = (filename, width) => {
  const plugins = [...coreSvgoPlugins];
  const classNames = ['svg', filename];

  plugins.push(
    { removeXMLNS: true },
    { addClassesToSVGElement: { classNames } },
    { addAttributesToSVGElement: { attribute: 'aria-hidden="true"' } },
  );
  const svgString = fs.readFileSync(`${paths.src.svg}${filename}.svg`, 'utf-8');

  return optimizeSvg(fixSvgDimensions(svgString, width), plugins);
};

// precompile svg located in /dist
gulp.task('svg', () => {
  gulp
    .src(paths.src.svg + '**/*.svg')
    .pipe(
      flatmap((stream, file) => {
        const filename = path.basename(file.path, '.svg');
        const plugins = [...coreSvgoPlugins];
        const classNames = ['svg', filename];
        plugins.push({ addClassesToSVGElement: { classNames } });
        file.contents = new Buffer(
          optimizeSvg(
            fixSvgDimensions(file.contents.toString('utf8')),
            plugins,
          ),
        );
        return stream;
      }),
    )
    .pipe(gulp.dest(outputPath.svg));
});

// write hashed assets in html
const getHash = filename => {
  try {
    const manifest = JSON.parse(
      fs.readFileSync(outputPath.root + 'manifest.json', 'utf8'),
    );
    if (manifest[filename]) {
      return manifest[filename];
    }
    return filename;
  } catch (err) {
    return filename;
  }
};

// dynamic data for templates
const dataGetter = () => ({
  svg: getSvg,
  hash: getHash,
});

// build html
gulp.task('html', () =>
  gulp
    .src([paths.src.html + '**/*'])
    .pipe(plumber({ errorHandler }))
    .pipe(data(dataGetter))
    .pipe(template())
    .pipe(gulp.dest(outputPath.html))
    .on('end', () => bs.reload()),
);

const inlineSvgBuild = data => {
  const plugins = [...coreSvgoPlugins];
  const optimized = optimizeSvg(fixSvgDimensions(decodeURI(data)), plugins);
  return encodeURI(optimized);
};

// postcss postCssProc
const postCssBase = [
  autoprefixer(),
  flexbugs(),
  assets({ loadPaths: [paths.src.assets] }),
  inlineSvg({ path: paths.src.assets, encode: inlineSvgBuild }),
];

const postCssProd = [
  mqpacker(),
  cssnano({
    preset: 'default',
  }),
];

const postCssConfig = isProd
  ? [...postCssBase, ...postCssProd]
  : [...postCssBase];

// compile scss for dev
gulp.task('styles', () =>
  gulp
    .src(paths.src.styles + '**/*.scss')
    .pipe(plumber({ errorHandler }))
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass(sassConfig))
    .pipe(postcss(postCssConfig))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(outputPath.styles))
    .pipe(bs.stream({ match: '**/*.css' })),
);

// compile scss for production
gulp.task('styles-production', () =>
  gulp
    .src(paths.src.styles + '**/*.scss')
    .pipe(plumber({ errorHandler }))
    .pipe(rename({ extname: '.css' }))
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass(sassConfig))
    .pipe(postcss(postCssConfig))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(outputPath.styles))
    .pipe(rev())
    .pipe(gulp.dest(outputPath.styles))
    .pipe(rev.manifest({ path: 'manifest.json', merge: true }))
    .pipe(gulp.dest(outputPath.root)),
);

// build / move all assets (raster & svg)
gulp.task('assets', () => {
  runSequence('svg', 'raster', 'fonts');
});

// build non-svg assets
gulp.task('raster', () =>
  gulp
    .src([
      paths.src.assets + '**/*',
      `!${paths.src.assets}fonts`,
      `!${paths.src.assets}fonts/**`,
      `!${paths.src.assets}svg`,
      `!${paths.src.assets}svg/**`,
    ])
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(gulp.dest(outputPath.assets)),
);

// move fonts
gulp.task('fonts', () =>
  gulp
    .src(paths.src.assets + 'fonts/**')
    .pipe(plumber())
    .pipe(gulp.dest(outputPath.assets + 'fonts')),
);

// browsersync
gulp.task('serve', () => {
  bsInit({
    proxy: 'localhost:8000',
    ghostMode: false,
    notify: false,
    ui: false,
    open: false,
  }).then(bs => {
    const url = `http://localhost:${bs.options.get('port')}`;
    notifier.notify({
      title: `Server started on ${url}`,
      message: `Click to open`,
      wait: true,
    });
    notifier.on('click', () => opn(url));
  });
});

// watch
gulp.task('watch', () => {
  watch(paths.src.styles + '**/*.scss', () => gulp.start('styles'));
  watch([paths.src.html + '**/*.html', outputPath.js + '**/*.js'], () =>
    gulp.start('html'),
  );
});

// default
gulp.task('default', () => {
  waitOn({ resources: [outputPath.js] }, () =>
    runSequence('styles', 'html', 'watch', 'serve'),
  );
});
