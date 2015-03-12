// Пример настройки сборщика для приложения nkb-app проекта rsearch
//
var _       = require("lodash"), // опционально
    _d      = require("lodash-deep"), // опционально
    path    = require('path'), // опционально
    webapp  = require('nullpointer-web-app');

_.mixin(_d);

//
module.exports = function(grunt) {
    webapp.setBuildMeta({
        APP_BUILD_TYPE: 'production',
        cwd: __dirname,
        name: 'nkb-app',
        rootpath: '/autokad/'
    });

    //
    var gruntConfig = webapp.getDefaultGruntConfig(),
        buildMeta   = webapp.getBuildMeta();

    // extend i18n
    _.deepSet(gruntConfig, 'i18n.ui_keys.options', {
        mode:           'simple',
        pattern:        '**/*.txt',
        inputDir:       path.resolve(__dirname, 'i18n/ui_keys/src'),
        inputRootPath:  path.resolve(__dirname, ''),
        outputDir:      path.resolve(__dirname, 'i18n/ui_keys'),
        bundleDir:      path.resolve(__dirname, 'src/l10n/ui_keys'),
        baseLang:       buildMeta.langs[0],
        langs:          buildMeta.langs
    });

    webapp.initGrunt(grunt, gruntConfig);
};
