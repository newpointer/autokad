var root = this;

/*
 * config
 *
 */
// i18n
var i18nBundles = [
    // internal
    'text!src/l10n/ui/bundle.json',
    'text!src/l10n/ui_keys/bundle.json'
];

//
root._APP_CONFIG = {
    lang: {
        defaultLang: 'ru',
        langs: ['ru', 'en']
    }
};

//
root._RESOURCES_CONFIG = {
    baseUrl: '/autokad',

    paths: {
        'angular':              'external_components/angular/angular',
        'angular-locale_ru':    'external_components/angular-i18n/angular-locale_ru',
        'angular-locale_en':    'external_components/angular-i18n/angular-locale_en',
        'ng-infinite-scroll':   'external_components/ngInfiniteScroll/ng-infinite-scroll',

        'jquery':               'external_components/jquery/jquery',
        'jquery.cookie':        'external_components/jquery.cookie/jquery.cookie',

        'purl':                 'external_components/purl/purl',
        'moment':               'external_components/moment/moment'
    },

    packages: [{
        name: 'app',
        location: 'src/nkb-app',
        main: 'app'
    }, {
        name: 'autokad',
        location: 'src/autokad',
        main: 'autokad'
    },
    /*
     * external packages
     *
     */
    {
        name: 'lodash',
        location: 'external_components/nullpointer-commons/lodash'
    }, {
        name: 'directives',
        location: 'external_components/nullpointer-commons/angular/directives',
        main: 'directives'
    }, {
        name: 'resource',
        location: 'external_components/nullpointer-commons/angular/resource',
        main: 'resource'
    }, {
        name: 'l10n',
        location: 'external_components/nullpointer-commons/angular/l10n',
        main: 'l10n'
    }, {
        name: 'i18n',
        location: 'external_components/nullpointer-i18n',
        main: 'i18n'
    }],

    shim: {
        'angular': {
            exports: 'angular'
        },
        'ng-infinite-scroll': {
            deps: ['angular']
        },

        'jquery.cookie': {
            deps: ['jquery']
        }
    },

    config: {
        'l10n/l10n': {
            lang: root._APP_CONFIG.lang,
            'i18n-component': {
                // Должны отличаться от общих настроек шаблонизатора,
                // т.к. смысл шаблонизации i18n:
                //   только перевести текст шаблона,
                //   а далее использовать переведённый шаблон с шаблонизатором по умолчанию
                templateSettings: {
                    evaluate:       '',
                    interpolate:    /\$\{([\s\S]+?)\}/g,
                    escape:         ''
                },
                escape: false
            },
            bundles: i18nBundles
        }
    },

    modules: [{
        name: 'app/main',
        include: [
            // locales
            'text!angular-locale_ru.js',
            'text!angular-locale_en.js'
        ].concat(i18nBundles)
    }],

    map: {
        '*': {
            'css': 'external_components/require-css/css',
            'less': 'external_components/require-less/less',
            'text': 'external_components/requirejs-text/text'
        }
    },

    less: {
        relativeUrls: true
    },

    urlArgs: new Date().getTime()
};

/*
 * init
 *
 */
if (typeof define === 'function' && define.amd) {
    requirejs.config(root._RESOURCES_CONFIG);

    require(['app'], function(app){
        // init app
        app.init(document);
    });
}
