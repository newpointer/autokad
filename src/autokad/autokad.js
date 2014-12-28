/**
 * @module autokad
 * @desc RequireJS/Angular module
 * @author ankostyuk
 */
define(function(require) {'use strict';

    var template        = require('text!./views/autokad.html');

                          require('jquery');
                          require('underscore');
    var i18n            = require('i18n'),
        angular         = require('angular'),
        moment          = require('moment');

    var submodules = {
        autokadResource:    require('./autokad-resource')
    };

    //
    var DEFAULT_SEARCH_PARAMS = {
        name: null,
        ogrn: null,
        inn: null,
        source: 'name',
        period: 'all',
    };

    var DEFAULT_REQUEST = {
        q: null,
        dateFrom: null,
        dateTo: null
    };

    var period = new Period();

    var TRANSFORM_SEARCH_PARAMS = {
        'source': {
            'name': function(searchParams, request) {
                request['q'] = searchParams['name'];
            },
            'ogrn': function(searchParams, request) {
                request['q'] = searchParams['ogrn'];
            },
            'inn': function(searchParams, request) {
                request['q'] = searchParams['inn'];
            }
        },
        'period': {
            'all': function(searchParams, request) {
                request['dateFrom'] = null;
            },
            'year': function(searchParams, request) {
                request['dateFrom'] = period.isoYearAgo;
            },
            'month': function(searchParams, request) {
                request['dateFrom'] = period.isoMonthAgo;
            }
        }
    };

    function buildRequest(searchParams) {
        var request = DEFAULT_REQUEST,
            value;

        _.each(TRANSFORM_SEARCH_PARAMS, function(paramTransform, param){
            value = searchParams[param];
            paramTransform[value](searchParams, request);
        });

        return request;
    }

    function Period() {
        var startOfDay  = moment().startOf('day'),
            monthAgo    = moment(startOfDay).subtract(1, 'months'),
            yearAgo     = moment(startOfDay).subtract(1, 'years'),
            isoMonthAgo = toISO(monthAgo),
            isoYearAgo  = toISO(yearAgo);

        // Делаем свое форматирование в ISO 8601,
        // т.к. kad.arbitr.ru "хочет" без таймзон:
        // YYYY-MM-DDThh:mm:ss
        //      "DateFrom": "2000-12-31T00:00:00"
        //      "DateTo": "2014-12-01T23:59:59"
        function toISO(d) {
            return d.format('YYYY-MM-DDTHH:mm:ss');
        }

        return {
            isoMonthAgo: isoMonthAgo,
            isoYearAgo: isoYearAgo
        };
    }

    //
    return angular.module('np.autokad', _.pluck(submodules, 'name'))
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .directive('npAutokad', ['$log', '$rootScope', 'npAutokadResource', function($log, $rootScope, npAutokadResource){
            return {
                restrict: 'A',
                template: template,
                scope: {},
                link: function(scope, element, attrs) {
                    var search = {
                        params: DEFAULT_SEARCH_PARAMS,
                        watch: true
                    };

                    var kadSearchRequest;

                    $rootScope.$on('np-autokad-do-search', function(e, options){
                        $log.log('np-autokad-do-search...', options);
                        initSearch(options.search);
                        kadSearch(options.success, options.error);
                    });

                    scope.$watch('search.params', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            if (search.watch) {
                                //$log.warn('*** watch...', search.params);
                                kadSearch();
                            } else {
                                search.watch = true;
                            }
                        }
                    }, true);

                    function initSearch(params) {
                        search.watch = false;
                        _.extend(search.params, DEFAULT_SEARCH_PARAMS, params);
                    }

                    function kadSearch(success, error) {
                        $log.log('kadSearch...', search.params);

                        var request = buildRequest(search.params);

                        $log.info('request...', request);

                        var hasError = false;

                        kadSearchRequest = npAutokadResource.kadSearch({
                            q: null,
                            previousRequest: kadSearchRequest,
                            success: function(data, status){
                                $log.log('success...', data);

                                // $log.warn('change ...');
                                // search.params.inn = null;
                            },
                            error: function(data, status){
                                $log.warn('error...');
                                hasError = true;
                            }
                        });

                        kadSearchRequest.completePromise.then(function(){
                            console.log('kadSearchRequest complete');

                            if (!hasError && _.isFunction(success)) {
                                success();
                            } else if (hasError && _.isFunction(error)) {
                                error();
                            }
                        });
                    }

                    //
                    _.extend(scope, {
                        search: search
                    });
                }
            };
        }]);
    //
});
