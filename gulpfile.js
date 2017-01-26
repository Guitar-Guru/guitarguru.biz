/* global require process */
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const htmlmin = require('gulp-htmlmin');
const client = require('firebase-tools');
const firebaseRewrites = require('browser-sync-middleware-firebase-rewrites');
const mocha = require('gulp-mocha');
const util = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');

const jsSources = ['app/scripts/*.js'];
const htmlSources = ['app/**/*.html'];
const cssSources = ['app/css/*.css'];
const tests = ['test/**/*.js'];
const appDir = './app/';
const outputDir = './dist/';
const files = jsSources.concat(htmlSources, cssSources, tests);

gulp.task('default', ['test']);

gulp.task('test', function () {
  return gulp.src(['test/**/*.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      ui: 'bdd'
    }))
    .on('error', util.log);
});

gulp.task('watch-test', function () {
  gulp.watch(files, ['test']);
});

gulp.task('build', ['html', 'css', 'js']);

gulp.task('deploy', function () {
  client.deploy({
    project: 'smiller-guitar-guru',
    token: process.env.FIREBASE_TOKEN,
    cwd: appDir
  }).then(function () {
    console.log('Rules have been deployed!');
    process.exit(0);
  }).catch(function (err) {
    if (err) {
      console.log(err.stack);
    }
    process.exit(1);
  });
});

gulp.task('serve', ['prefix','browser-sync'], function () {
  gulp.watch(htmlSources).on('change', browserSync.reload);
  gulp.watch(cssSources, ['prefix']);
  gulp.watch(jsSources).on('change', browserSync.reload);
});

gulp.task('browser-sync', function () {
  browserSync.init(files, {
    server: {
      baseDir: appDir,
      routes: {
        '/styles': 'app/css/prefixed'
      }
    },
    middleware: [
      firebaseRewrites({
        firebase: require('./firebase.json'),
        baseDir: appDir
      })
    ]
  });
});

gulp.task('prefix', function () {
  return gulp.src(cssSources)
    .pipe(autoprefixer())
    .pipe(gulp.dest('app/css/prefixed'))
    .pipe(browserSync.stream());
});

gulp.task('css', function () {
  return gulp.src(cssSources)
    .pipe(sourcemaps.init())
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(outputDir + '/styles'));
});

gulp.task('js', function () {
  return gulp.src(jsSources)
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(outputDir + '/scripts'));
});

gulp.task('html', function () {
  return gulp.src(htmlSources)
    .pipe(htmlmin({
      collapseWhitespace: true,
      conservativeCollapse: true,
      minifyJS: true,
      minifyCSS: true,
      removeComments: true
    }))
    .pipe(gulp.dest(outputDir));
});
