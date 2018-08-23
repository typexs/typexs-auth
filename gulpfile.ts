import {Gulpclass, Task, SequenceTask, MergedTask} from 'gulpclass';


import * as fs from 'fs';
import * as glob from 'glob';
import * as gulp from 'gulp';
import * as watch from 'gulp-watch';


// const debug = require('gulp-debug');
//import * as ts from "gulp-typescript";


const bump = require('gulp-bump');
const del = require('del');
const shell = require('gulp-shell');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const debug = require('gulp-debug');
const sequence = require('run-sequence');
const webpack = require('webpack-stream');


// ngc -p tsconfig.app.json


@Gulpclass()
export class Gulpfile {


  /**
   * Cleans build folder.
   */
  @Task()
  clean(cb: Function) {
    return del(['./build/**'], cb);
  }

  /**
   * ngCleans build folder.
   */
  @Task()
  ngClean(cb: Function) {
    return del(['./build/ngPackage/**'], cb);
  }


  /**
   * Runs typescript files compilation.
   */
  @Task()
  compile() {
    return gulp.src('package.json', {read: false})
      .pipe(shell(['tsc']));
  }

  // -------------------------------------------------------------------------
  // Create / Update index.ts
  // -------------------------------------------------------------------------

  /**
   * Generate index.ts declaration
   */
  @Task()
  generateIndexTs() {
    let _glob = glob.sync('src/**').filter((f: string) => /\.ts$/.test(f) && !/^(src\/packages|src\/index\.ts$)/.test(f));
    let forIndexTs: string[] = ['// ---- Generated by gulp task ----'];
    let indexTs = '';
    let settings: any = {};
    if (fs.existsSync('./.typexs.json')) {
      settings = require('./.typexs.json');
      if (settings.packageExports) {
        settings.packageExports.forEach((f: string) => {
          forIndexTs.push(`export * from "${f}";`);
        });
      }
    }
    _glob.forEach((f: string) => {
      if (!/\/\/ index\.ts ignore/.test(fs.readFileSync(f).toString('utf-8'))) {
        forIndexTs.push(`export * from "./${f.replace(/(^src\/)|((\.d)?\.ts$)/g, '')}";`);
      }
    });
    fs.writeFileSync('./src/index.ts', forIndexTs.join('\n'));
    return;
  }


  // -------------------------------------------------------------------------
  // Package
  // -------------------------------------------------------------------------

  /**
   * Copies all sources to the package directory.
   */
  @MergedTask()
  packageCompile() {
    const tsProject = ts.createProject('tsconfig.json');
    const tsResult = gulp.src([
      './src/**/*.ts',
      '!./src/**/files/*.ts',
      '!./src/**/files/**/*.ts',
      '!./src/app/**',
      '!./src/modules/*/*.ts',
      '!./src/modules/*/!(api|entities)/*.ts',
      '!./src/modules/*/!(api|entities)/**/*.ts',
      './src/modules/*/+(api|entities)/*.ts',
      './src/modules/*/+(api|entities)/**/*.ts',
      './node_modules/@types/**/*.ts'])
      .pipe(sourcemaps.init())
      .pipe(tsProject());

    return [
      tsResult.dts.pipe(gulp.dest('./build/package')),
      tsResult.js
        .pipe(sourcemaps.write('.', {sourceRoot: '', includeContent: true}))
        .pipe(gulp.dest('./build/package'))
    ];
  }

  @Task()
  packageNgCompile() {
    return gulp.src('bundles/package.json', {read: false})
      .pipe(shell([
        'ng-packagr -p bundles/package.json'
      ]));
  }

  @Task()
  packageNgCopy() {
    return gulp.src([
      './src/modules/**/*.+(html|css|less|sass|scss)',
      '!./src/modules/*/api/**',
      '!./src/modules/*/entities/**',
      // "./build/app/src/modules/**/*",
      // "!./build/app/src/modules/app/**",
      '!./src/modules/app/**'])
    //  .pipe(debug())
      .pipe(gulp.dest('./build/ngPackage/modules'));
  }

  @Task()
  packageNgMetadataCopy() {
    return gulp.src([
      './src/*.metadata.json'])
      .pipe(gulp.dest('./build/ngPackage'));
  }


  // @Task()
  // packageNgWebpack() {
  //   return gulp.src(['./build/app/src/modules/**/*.component.js','!./src/modules/app/**'])
  //     .pipe(debug())
  //     .pipe(webpack( require('./webpack.config.js') ))
  //     .pipe(gulp.dest('./build/prebuild'));
  // }


  /**
   * Removes /// <reference from compiled sources.
   */
  @Task()
  packageReplaceReferences() {
    return gulp.src('./build/package/**/*.d.ts')
      .pipe(replace(`/// <reference types="node" />`, ''))
      .pipe(replace(`/// <reference types="chai" />`, ''))
      .pipe(gulp.dest('./build/package'));
  }

  /**
   * Copies README.md into the package.
   */
  @Task()
  packageCopyReadme() {
    return gulp.src('./README.md')
      .pipe(replace(/```typescript([\s\S]*?)```/g, '```javascript$1```'))
      .pipe(gulp.dest('./build/package'));
  }

  /**
   * Copies README.md into the package.
   */
  @Task()
  packageCopyJsons() {
    return gulp.src(['./src/**/*.json', '!./src/app/**', '!./src/modules/**']).pipe(gulp.dest('./build/package'));
  }

  /**
   * Copies README.md into the package.
   */
  @Task()
  packageCopyHtml() {
    return gulp.src(['./src/app/themes/**/*.html']).pipe(gulp.dest('./build/package/app/themes'));
  }

  /**
   * Copies README.md into the package.
   */
  @Task()
  packageCopyFiles() {
    return gulp.src(['./src/**/files/**/*']).pipe(gulp.dest('./build/package'));
  }

  /**
   * Copies README.md into the package.
   */
  // @Task()
  // packageCopyModulContents() {
  //   return gulp.src(["./src/modules/**/*.+(html|css|less|sass|scss|ts)","!./src/modules/app/**" ,"!./src/modules/**/*.spec.ts"])
  //     .pipe(gulp.dest("./build/package/modules"));
  // }

  /**
   * Copies Bin files.
   */
  @Task()
  packageCopyBin() {
    return gulp.src('./bin/*').pipe(gulp.dest('./build/package/bin'));
  }


  /**
   * Copy package.json file to the package.
   */
  @Task()
  packagePreparePackageFile() {
    return gulp.src('./package.json')
      .pipe(replace('"private": true,', '"private": false,'))
      .pipe(gulp.dest('./build/package'));
  }


  /**
   * Creates a package that can be published to npm.
   */
  @SequenceTask()
  package() {
    return [
      'clean',
      'packageNg',
      'packageCompile',
      [
        'packageCopyBin',
        'packageCopyJsons',
        'packageCopyFiles',
        'packageCopyHtml',
        'packageReplaceReferences',
        'packagePreparePackageFile',
        'packageCopyReadme',
      ],
    ];
  }

  /**
   * Creates a package that can be published to npm.
   */
  @SequenceTask()
  packageNg() {
    return [
      'ngClean',
      'packageNgCompile'
    ];
  }

  /**
   * Creates a package that can be published to npm.
   */
  @SequenceTask()
  packageNoClean() {
    return [
      'packageCompile',
      'packageNgCompile',
      [
        'packageCopyBin',
        'packageCopyJsons',
        'packageCopyFiles',
        'packageCopyHtml',
        'packageReplaceReferences',
        'packagePreparePackageFile',
        'packageCopyReadme',
      ],
    ];
  }


  @SequenceTask('watchPackage')
  watchPackage(): any {
    return watch(['src/**/*.(ts|json|css|scss)'], {ignoreInitial: false, read: false}, (file: any) => {
      sequence(['packageNoClean']);
    });

  }

  // -------------------------------------------------------------------------
  // Main Packaging and Publishing tasks
  // -------------------------------------------------------------------------

  /**
   * Publishes a package to npm from ./build/package directory.
   */
  @Task()
  packagePublish() {
    return gulp.src('package.json', {read: false})
      .pipe(shell([
        'cd ./build/package && npm publish --access=public'
      ]));
  }

  @Task()
  packageNgPublish() {
    return gulp.src('build/ngPackage/package.json', {read: false})
      .pipe(shell([
        'cd ./build/ngPackage && npm publish --access=public'
      ]));
  }

  /**
   * Publishes a package to npm from ./build/package directory with @next tag.
   */
  @Task()
  packagePublishNext() {
    return gulp.src('package.json', {read: false})
      .pipe(shell([
        'cd ./build/package && npm publish --tag next'
      ]));
  }


  // -------------------------------------------------------------------------
  // Versioning
  // -------------------------------------------------------------------------

  @Task()
  vpatch() {
    return Gulpfile._bump('patch');
  }

  @Task()
  vminor() {
    return Gulpfile._bump('minor');
  }

  @Task()
  vmajor() {
    return Gulpfile._bump('major');
  }


  static _bump(src: string) {
    return [
      gulp.src('package.json')
        .pipe(bump({type: src}))
        .pipe(gulp.dest('./')),
      gulp.src('bundles/package.json')
        .pipe(bump({type: src}))
        .pipe(gulp.dest('./bundles'))]
      ;

  }


}
