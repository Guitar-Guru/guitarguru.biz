/* global require process */
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const vulcanize = require('gulp-vulcanize');
const htmlmin = require('gulp-htmlmin');
const client = require('firebase-tools');
const firebaseRewrites = require('browser-sync-middleware-firebase-rewrites');
const mocha = require('gulp-mocha');
const util = require('gulp-util');

const jsSources = ['app/scripts/*.js'];
const htmlSources = ['app/**/*.html'];
const cssSources = ['app/styles/*.css'];
const tests = ['test/**/*.js'];
const appDir = './app/';
const outputDir = 'dist';
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

gulp.task('build', ['vulcanize']);

gulp.task('deploy', function () {
  client.deploy({
    project: 'js-damage-calc',
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

gulp.task('serve', ['browser-sync'], function () {
  gulp.watch(htmlSources).on('change', browserSync.reload);
  gulp.watch(jsSources).on('change', browserSync.reload);
});

gulp.task('browser-sync', function () {
  browserSync.init(files, {
    server: {
      baseDir: appDir
    },
    middleware: [
      firebaseRewrites({
        firebase: require('./firebase.json'),
        baseDir: appDir
      })
    ]
  });
});

gulp.task('vulcanize', function () {
  return gulp.src('app/index.html')
    .pipe(vulcanize({
      abspath: '',
      excludes: [],
      stripExcludes: false,
      inlineScripts: true,
      inlineCss: true,
      stripComments: true
    }))
    .pipe(htmlmin({
      removeEmptyAttributes: true,
      // customAttrAssign: [{"source":"\\$="}],
      // customAttrSurround: [
      //     [ {"source": "\\({\\{"}, {"source": "\\}\\}"} ],
      //     [ {"source": "\\[\\["}, {"source": "\\]\\]"}  ]
      // ],
      collapseWhitespace: true,
      // always leave one space
      // because http://perfectionkills.com/experimenting-with-html-minifier/#collapse_whitespace
      conservativeCollapse: true,
      minifyJS: true,
      minifyCSS: true,
      removeComments: true,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true
    }))
    .pipe(gulp.dest(outputDir));
});
