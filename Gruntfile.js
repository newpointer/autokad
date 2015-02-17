//
var fs      = require('fs-extra'),
    path    = require('path'),
    _       = require('lodash'),
    i18n    = require('nullpointer-i18n-bin'),
    wb      = require('nullpointer-web-bin');

//
module.exports = function(grunt) {
    //
    var buildInfo = {
        'nkb-app': {
            main: require('./src/nkb-app/main.js'),
            hash: null
        }
    };

    //
    var APP_LANGS = buildInfo['nkb-app'].main._APP_CONFIG.lang.langs;

    //
    grunt.initConfig({
        clean: {
            deps: ['node_modules', 'bower_components', 'external_components'],
            target: ['target'],
            dist: ['dist']
        },

        jshint: {
            options: {
                force: true,
                browser: true,
                '-W069': true
            },
            src: [
                'src/**/*.js'
            ]
        },

        copy: {
            'dist-nkb-app': {
                expand: true,
                flatten: true,
                cwd: 'target/web-resources-build/nkb-app',
                src: [
                    'build.properties',
                    'src/nkb-app/favicon.ico',
                    'src/nkb-app/main.js',
                    'src/nkb-app/index.html'
                ],
                dest: 'dist/nkb-app',
                options: {
                    noProcess: '**/*.{ico,properties,js,xml}',
                    process: function (content, srcpath) {
                        if (srcpath === 'target/web-resources-build/nkb-app/src/nkb-app/index.html') {
                            return content.replace(/\${nkb-app.build.id}/g, buildInfo['nkb-app'].hash);
                        }

                        return content;
                    }
                }
            }
        },

        bower: {
            install: {
                options: {
                    targetDir: 'external_components',
                    layout: 'byComponent',
                    install: true,
                    verbose: true,
                    cleanTargetDir: true,
                    cleanBowerDir: false,
                    bowerOptions: {
                        forceLatest: true,
                        production: false
                    }
                }
            }
        },

        i18n: {
            'ui': {
                options: {
                    pattern:        '**/*.+(js|html)',
                    inputDir:       path.resolve(__dirname, 'src'),
                    inputRootPath:  path.resolve(__dirname, ''),
                    outputDir:      path.resolve(__dirname, 'i18n/ui'),
                    bundleDir:      path.resolve(__dirname, 'src/l10n/ui'),
                    baseLang:       APP_LANGS[0],
                    langs:          APP_LANGS
                }
            },
            'ui_keys': {
                options: {
                    mode:           'simple',
                    pattern:        '**/*.txt',
                    inputDir:       path.resolve(__dirname, 'i18n/ui_keys/src'),
                    inputRootPath:  path.resolve(__dirname, ''),
                    outputDir:      path.resolve(__dirname, 'i18n/ui_keys'),
                    bundleDir:      path.resolve(__dirname, 'src/l10n/ui_keys'),
                    baseLang:       APP_LANGS[0],
                    langs:          APP_LANGS
                }
            }
        },

        'process-resources': {
            'external_components': {
                options: {
                    inputDir: path.resolve(__dirname, 'external_components'),
                    outputDir: path.resolve(__dirname, 'target/web-resources-process/external_components'),

                    urlToBase64: true,

                    // значение будет взято из аргумента [grunt process-resources:build:true|false], см. register task web-resources
                    skipProcess: null
                }
            },
            'src': {
                options: {
                    inputDir: path.resolve(__dirname, 'src'),
                    outputDir: path.resolve(__dirname, 'target/web-resources-process/src'),

                    urlToBase64: true,

                    // значение будет взято из аргумента [grunt process-resources:build:true|false], см. register task web-resources
                    skipProcess: null
                }
            }
        },

        'web-resources': {
            'build-nkb-app': {
                appBuildInfoName: 'nkb-app',
                options: {
                    propertiesFile: path.resolve(__dirname, 'target/web-resources-build/nkb-app/build.properties'),
                    mainFile: path.resolve(__dirname, 'target/web-resources-build/nkb-app/src/nkb-app/main.js'),

                    requirejs: _.extend({}, buildInfo['nkb-app'].main._RESOURCES_CONFIG, {
                        dir: path.resolve(__dirname, 'target/web-resources-build/nkb-app'),
                        baseUrl: path.resolve(__dirname, 'target/web-resources-process'),

                        less: {
                            // TODO разобраться со статикой при деплое
                            rootpath: '/autokad/',
                            relativeUrls: true
                        },

                        optimize: 'uglify2',
                        uglify2: {
                            mangle: true,
                            output: {
                                comments: /-- DO_NOT_DELETE --/
                            }
                        },

                        removeCombined: false,
                        preserveLicenseComments: false
                    }),

                    // значение будет взято из аргумента [grunt web-resources-xxx:build:true|false], см. register task web-resources
                    skipOptimize: null
                }
            }
        }
    });

    //
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bower-task');

    //
    grunt.task.registerMultiTask('i18n', function(arg1) {
        var done = this.async();

        i18n.run(this.data.options, function(){
            done();
        });
    });

    //
    grunt.task.registerMultiTask('process-resources', function(skip) {
        var done        = this.async(),
            options     = this.data.options,
            skipProcess = (skip === 'true');

        fs.removeSync(options.outputDir);
        fs.mkdirsSync(options.outputDir);

        wb.processResources.run(_.extend(options, {
            skipProcess: skipProcess
        }), function(){
            done();
        });
    });

    //
    grunt.task.registerMultiTask('web-resources', function(skipOptimize) {
        var done            = this.async(),
            options         = this.data.options,
            appBuildInfo    = buildInfo[this.data.appBuildInfoName],
            skipOptimize    = (skipOptimize === 'true');

        fs.removeSync(options.requirejs.dir);
        fs.mkdirsSync(options.requirejs.dir);

        wb.requirejsOptimize.run(_.extend(options, {
            skipOptimize: skipOptimize
        }), function(hash){
            appBuildInfo.hash = hash;
            done();
        });
    });

    //
    grunt.registerTask('init', ['bower']);
    grunt.registerTask('dist', ['clean:dist', 'copy:dist-nkb-app']);
    grunt.registerTask('build', ['clean:target', 'init', 'jshint', 'process-resources:external_components:false', 'process-resources:src:false', 'web-resources:build-nkb-app:false', 'dist']);
    grunt.registerTask('cleanup', ['clean:deps', 'clean:target']);
};
