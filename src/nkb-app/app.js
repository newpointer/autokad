//
define(function(require) {'use strict';
    var root = window;

    //
                  require('jquery');
                  require('underscore');

    var angular = require('angular'),
        purl    = require('purl');

                  require('css!../external_components/bootstrap/css/bootstrap');
                  require('less!./styles/app');

    var submodules = {
        l10n:           require('l10n'),
        autokad:        require('autokad')
    };

    var app = angular.module('app', _.pluck(submodules, 'name'))
        //
        .constant('appConfig', {
            name: 'autokad'
        })
        //
        .config(['$logProvider', function($logProvider){
            $logProvider.debugEnabled(false);
        }])
        //
        .run(['$log', '$timeout', '$rootScope', 'npL10n', function($log, $timeout, $rootScope, npL10n){
            //
            _.extend($rootScope, {
                app: {
                    title: null,
                    ready: false
                },
                isAppReady: function() {
                    return $rootScope.app.ready;
                }
            });

            //
            $timeout(function(){
                var params  = purl().param();

                var search = {
                    name: params['search'],
                    ogrn: params['ogrn'],
                    inn: params['inn']
                };

                $rootScope.app.title = search.name;

                $rootScope.$emit('np-autokad-do-search', {
                    search: search,
                    success: function() {
                        $rootScope.app.ready = true;
                    },
                    error: function() {
                        $log.warn('search error, search options:', search);
                        $rootScope.app.ready = true;
                    }
                });
            });
        }]);
    //

    return {
        // TODO promises: l10n, ...?
        init: function(parent) {
            _.delay(function(){
                $(function() {
                    angular.bootstrap(parent, [app.name]);
                });
            }, 100);
        }
    };
});
