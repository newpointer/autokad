/**
 * @module autokad
 * @desc RequireJS/Angular module
 * @author ankostyuk
 */
define(function(require) {'use strict';

                          require('less!./styles/autokad');

    var template        = require('text!./views/autokad.html');

                          require('jquery');
                          require('underscore');
    var i18n            = require('i18n'),
        angular         = require('angular'),
        moment          = require('moment');
                          require('ng-infinite-scroll');

    var submodules = {
        autokadResource:    require('./autokad-resource')
    };

    //
    return angular.module('np.autokad', _.pluck(submodules, 'name').concat(['infinite-scroll']))
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .factory('npAutokadHelper', ['$log', '$timeout', function($log, $timeout){
            /*
             * request
             *
             */
            var DEFAULT_SEARCH_PARAMS = {
                name: null,
                ogrn: null,
                inn: null,
                source: 'name',
                period: 'all',
            };

            var DEFAULT_REQUEST_DATA = {
                q: null,
                dateFrom: null,
                dateTo: null,
                page: 1
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

            function buildRequestData(searchParams) {
                var requestData = DEFAULT_REQUEST_DATA,
                    value;

                _.each(TRANSFORM_SEARCH_PARAMS, function(paramTransform, param){
                    value = searchParams[param];
                    paramTransform[value](searchParams, requestData);
                });

                return requestData;
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

            /*
             * loading
             *
             */
            var loadingShowDelay = 500,
                loadingId;

            function loading(element, operation) {
                loadingId = _.uniqueId();

                process(loadingId, operation);

                function process(id, operation) {
                    var complete = false;

                    $timeout(function(){
                        if (!complete && id === loadingId) {
                            element.addClass('loading');
                        }
                    }, loadingShowDelay);

                    operation(done);

                    function done() {
                        $timeout(function(){
                            if (id === loadingId) {
                                element.removeClass('loading');
                                complete = true;
                            }
                        });
                    }
                }
            }

            // API
            return {
                getDefaultSearchParams: function() {
                    return DEFAULT_SEARCH_PARAMS;
                },
                buildRequestData: buildRequestData,
                loading: loading
            };
        }])
        //
        .directive('npAutokad', ['$log', '$rootScope', 'npAutokadResource', 'npAutokadHelper', function($log, $rootScope, npAutokadResource, npAutokadHelper){
            return {
                restrict: 'A',
                template: template,
                scope: {},
                link: function(scope, element, attrs) {
                    var search = {
                        params: null,
                        requestData: null,
                        request: null,
                        result: { // В формате kad.arbitr.ru
                            'TotalCount': null,
                            'PagesCount': null,
                            'Items': null
                        },
                        pager: new Pager(),
                        getTotal: function() {
                            return search.result.TotalCount || 0;
                        },
                        isEmptyResult: function() {
                            return !search.result.TotalCount;
                        },
                        isNoResult: function() {
                            return search.noResult;
                        },
                        noResult: true,
                        watch: true
                    };

                    $rootScope.$on('np-autokad-do-clear', function(){
                        clearSearch();
                    });

                    $rootScope.$on('np-autokad-do-search', function(e, options){
                        initSearch(options.search);
                        doSearch(
                            function(){
                                search.noResult = search.isEmptyResult();
                                if (_.isFunction(options.success)) {
                                    options.success();
                                }
                            },
                            function(){
                                search.noResult = true;
                                if (_.isFunction(options.error)) {
                                    options.error();
                                }
                            });
                    });

                    scope.$watch('search.params', function(newValue, oldValue) {
                        if (newValue !== oldValue) {
                            if (search.watch) {
                                doSearch();
                            } else {
                                search.watch = true;
                            }
                        }
                    }, true);

                    function initSearch(params) {
                        search.watch = false;
                        search.params = _.extend({}, npAutokadHelper.getDefaultSearchParams(), params);
                    }

                    function doSearch(success, error) {
                        search.requestData = npAutokadHelper.buildRequestData(search.params);

                        if (!search.requestData.q) {
                            complete(true);
                        } else {
                            resetSearchRequest();
                            npAutokadHelper.loading(element, function(done){
                                searchRequest(function(hasError, result){
                                    complete(hasError, result);
                                    done();
                                });
                            });
                        }

                        function complete(hasError, result) {
                            if (!hasError) {
                                search.result = result;

                                search.pager.reset(noMore(hasError, result), function(callback){
                                    search.requestData.page++;

                                    npAutokadHelper.loading(element, function(done){
                                        searchRequest(function(hasError, result){
                                            _.each(result.Items, function(item){
                                                search.result.Items.push(item);
                                            });

                                            callback(noMore(hasError, result));
                                            done();
                                        });
                                    });
                                });

                                if (_.isFunction(success)) {
                                    success();
                                }
                            } else if (_.isFunction(error)) {
                                error();
                            }
                        }

                        function noMore(hasError, result) {
                            return hasError || (result ? search.requestData.page >= result['PagesCount'] : true);
                        }
                    }

                    function resetSearchRequest() {
                        if (search.request) {
                            search.request.abort();
                        }
                        search.requestData.page = 1;
                    }

                    function clearSearch() {
                        resetSearchRequest();
                        search.pager.reset(true, null);
                        search.result = {};
                        search.noResult = true;
                    }

                    function searchRequest(callback) {
                        var hasError    = false,
                            result      = {};

                        search.request = npAutokadResource.kadSearch({
                            r: search.requestData,
                            previousRequest: search.request,
                            success: function(data, status){
                                result = data.Result;
                            },
                            error: function(data, status){
                                hasError = true;
                            }
                        });

                        search.request.completePromise.then(complete, complete);

                        function complete() {
                            callback(hasError, result);
                        }
                    }

                    //
                    function Pager() {
                        var internalDisabled    = false,
                            noNextPage          = false,
                            nextPageHandler     = null;

                        function isDisabled() {
                            return internalDisabled || noNextPage || !nextPageHandler;
                        }

                        return {
                            reset: function(noMore, pageHandler) {
                                internalDisabled = false;
                                noNextPage = noMore;
                                nextPageHandler = pageHandler;
                            },
                            nextPage: function() {
                                if (!isDisabled() && nextPageHandler) {
                                    internalDisabled = true;

                                    nextPageHandler(function(noMore){
                                        internalDisabled = false;
                                        noNextPage = noMore;
                                    });
                                }
                            },
                            isDisabled: isDisabled
                        };
                    }

                    //
                    _.extend(scope, {
                        search: search
                    }, i18n.translateFuncs);
                }
            };
        }])
        //
        .filter('highlightSearch', ['$sce', function($sce){
            return function(text, query){
                if (!query || !text) {
                    return $sce.trustAsHtml(text);
                }

                var ignorePattern   = '[\\s"«»]+',
                ignoreRegexp    = new RegExp(ignorePattern, ''),
                queries         = query.split(ignoreRegexp),
                q               = '',
                t, i;

                for (i = 0; i < queries.length; i++) {
                    t = queries[i];
                    if (t) {
                        q += q ? (ignorePattern + t) : t;
                    }
                }

                q = q ? ('["«]?' + q + '["»]?') : '';

                text = text.replace(new RegExp(q, 'igm'), '<b>$&</b>');

                return $sce.trustAsHtml(text);
            };
        }]);
    //
});
