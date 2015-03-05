//
define(function(require) {'use strict';
    var root = window;

    //
                  require('jquery');
                  require('lodash');

    var angular = require('angular'),
        purl    = require('purl'),
        l10n    = require('l10n');

                  require('css!../external_components/bootstrap/css/bootstrap');
                  require('less!./styles/app');

    var submodules = {
        'np.l10n':      require('l10n/np.l10n'),
        autokad:        require('autokad')
    };

    var app = angular.module('app', _.pluck(submodules, 'name'))
        //
        .config(['$logProvider', function($logProvider){
            $logProvider.debugEnabled(false);
        }])
        //
        .run(['$log', '$timeout', '$rootScope', 'npAutokadHelper', function($log, $timeout, $rootScope, npAutokadHelper){
            //
            _.extend($rootScope, {
                app: {
                    title: null,
                    ready: true
                },
                isAppReady: function() {
                    return $rootScope.app.ready;
                }
            });

            //
            $timeout(function(){
                var params  = purl().param();

                var search = {
                    sources: [
                        {key: 'company_name', value: params['search']},
                        {key: 'company_ogrn', value: params['ogrn']},
                        {key: 'company_inn', value: params['inn']}
                    ]
                };

                $rootScope.app.title = params['search'];

                $rootScope.$emit('np-autokad-do-search', {
                    search: search,
                    searchSource: 0,
                    success: function() {},
                    error: function() {
                        $log.warn('search error, search options:', search);
                    }
                });

                // test
                // $(document).click(function(){
                //     $rootScope.$emit('np-autokad-do-clear');
                //
                //     //
                //     var caseCountRequest;
                //
                //     caseCount();
                //     caseCount();
                //
                //     function caseCount() {
                //         if (caseCountRequest) {
                //             caseCountRequest.abort();
                //         }
                //
                //         caseCountRequest = npAutokadHelper.getCaseCount(search,
                //             function(result, source) {
                //                 $log.info('getCaseCount... success', result, source);
                //             },
                //             function() {
                //                 $log.warn('getCaseCount... error');
                //             },
                //             function() {
                //                 $log.info('getCaseCount... complete');
                //             });
                //     }
                // });
            });
        }]);
    //

    return {
        init: function(parent) {
            $(function() {
                l10n.initPromise.done(function(){
                    angular.bootstrap(parent, [app.name]);
                });
            });
        }
    };
});
