//
define(function(require) {'use strict';
    var root = window;

    //
                  require('jquery');
                  require('underscore');

    var angular = require('angular');

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
        .run(['$log', '$rootScope', 'npL10n', function($log, $rootScope, npL10n){
            //
            _.extend($rootScope, {
                app: {
                    isSearch: null,
                    ready: false
                },
                isAppReady: function() {
                    return $rootScope.app.ready;
                }
            });

            //
            //$rootScope.$on('xxx-init', function(e, scope){
                _.extend($rootScope.app, {
                    ready: true
                });
            //});
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
