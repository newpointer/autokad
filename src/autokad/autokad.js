/**
 * @module autokad
 * @desc RequireJS/Angular module
 * @author ankostyuk
 */
define(function(require) {'use strict';

                          require('less!./styles/autokad');

    var template        = require('text!./views/autokad.html');

                          require('jquery');
                          require('lodash');
    var i18n            = require('i18n'),
        angular         = require('angular'),
        moment          = require('moment');
                          require('ng-infinite-scroll');

    var extmodules = {
        'directives':       require('directives')
    };

    var submodules = {
        'autokadResource':  require('./autokad-resource')
    };

    //
    return angular.module('np.autokad', _.pluck(extmodules, 'name').concat(_.pluck(submodules, 'name')).concat(['infinite-scroll']))
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .factory('npAutokadHelper', ['$log', '$timeout', 'npAutokadResource', function($log, $timeout, npAutokadResource){
            /*
             * request
             *
             */
            var DEFAULT_SEARCH_PARAMS = {
                sources: [],
                source: 0,
                period: 'all',
                caseType: 'any'
            };

            var DEFAULT_SEARCH_REQUEST_DATA = {
                q: null,
                dateFrom: null,
                dateTo: null,
                page: 1
            };

            var period = new Period();

            var TRANSFORM_SEARCH_PARAMS = {
                'source': function(value, searchParams, request) {
                    request['q'] = searchParams.sources[value].value;
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
                },
                'caseType': function(value, searchParams, request) {
                    request['caseType'] = value;
                }
            };

            function buildSearchRequestData(searchParams) {
                var requestData = _.extend({}, DEFAULT_SEARCH_REQUEST_DATA),
                    value;

                _.each(TRANSFORM_SEARCH_PARAMS, function(paramTransform, param){
                    value = searchParams[param];

                    if (_.isFunction(paramTransform)) {
                        paramTransform(value, searchParams, requestData);
                    } else {
                        paramTransform[value](searchParams, requestData);
                    }
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

            /*
             * case
             *
             */
            function CaseCountRequest() {
                var request;

                return {
                    _setRequest: function(r) {
                        request = r;
                    },
                    abort: function() {
                        if (request) {
                            request.abort();
                        }
                    }
                };
            }

            function getCaseCount(search, success, error, complete) {
                if (!_.isArray(search.sources) || !_.size(search.sources)) {
                    $log.warn('getCaseCount... error: search.sources is blank');
                    errorCallback();
                    return null;
                }

                var sourceIndex         = 0,
                    sourceCount         = _.size(search.sources),
                    caseCountRequest    = new CaseCountRequest(),
                    result              = null,
                    source, request;

                nextRequest();

                function nextRequest() {
                    var error   = false,
                        next    = false,
                        q;

                    source = search.sources[sourceIndex++];
                    q = source.value;

                    if (_.isBlank(q)) {
                        request = null;
                        result = 0;
                        next = true;
                        caseCountRequest._setRequest(request);
                        check();
                    } else {
                        request = npAutokadResource.kadSearch({
                            r: {
                                q: q
                            },
                            success: function(data) {
                                result = getResultTotal(data['Result']);

                                if (_.isNull(result)) {
                                    error = true;
                                } else if (result === 0) {
                                    next = true;
                                }
                            },
                            error: function() {
                                error = true;
                            }
                        });

                        caseCountRequest._setRequest(request);

                        request.completePromise.then(function(){
                            check();
                        });
                    }

                    function check() {
                        if (error) {
                            errorCallback();
                        } else if (!next || sourceIndex === sourceCount) {
                            successCallback();
                        } else if (next) {
                            nextRequest();
                        }
                    }
                }

                function successCallback() {
                    if (_.isFunction(success)) {
                        success(result, sourceIndex - 1);
                    }
                    completeCallback();
                }

                function errorCallback() {
                    if (_.isFunction(error)) {
                        error();
                    }
                    completeCallback();
                }

                function completeCallback() {
                    if (_.isFunction(complete)) {
                        complete();
                    }
                }

                return caseCountRequest;
            }

            function getResultTotal(result) {
                var r = result && result['TotalCount'];

                if (!_.isNumber(r)) {
                    r = null;
                }

                return r;
            }

            // API
            return {
                getDefaultSearchParams: function() {
                    return DEFAULT_SEARCH_PARAMS;
                },
                getDefaultSearchRequestData: function() {
                    return DEFAULT_SEARCH_REQUEST_DATA;
                },
                buildSearchRequestData: buildSearchRequestData,
                loading: loading,
                getResultTotal: getResultTotal,
                getCaseCount: getCaseCount
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
                            return hasSearchResult() ? search.result.TotalCount || 0 : 0;
                        },
                        isEmptyResult: function() {
                            return !search.getTotal();
                        },
                        isNoResult: function() {
                            return search.noResult;
                        },
                        hasError: function() {
                            return search.error;
                        },
                        noResult: true,
                        error: null,
                        watch: true
                    };

                    $rootScope.$on('np-autokad-do-clear', function(){
                        clearSearch();
                    });

                    $rootScope.$on('np-autokad-do-search', function(e, options){
                        var searchSources       = options.search.sources,
                            sourceIndex         = options.searchSource || 0,
                            sourceCount         = _.size(searchSources),
                            result              = null,
                            source;

                        nextSearch();

                        function nextSearch() {
                            var error   = false,
                                next    = false;

                            source = searchSources[sourceIndex];

                            initSearch(options.search, sourceIndex);

                            sourceIndex++;

                            doSearch(
                                function() {
                                    result = npAutokadHelper.getResultTotal(search.result);

                                    if (_.isNull(result)) {
                                        error = true;
                                    } else if (result === 0) {
                                        next = true;
                                    }

                                    complete();
                                },
                                function() {
                                    error = true;
                                    complete();
                                },
                                function() {
                                    next = true;
                                    complete();
                                });

                            function complete() {
                                if (error) {
                                    errorCallback();
                                } else if (!next || sourceIndex === sourceCount) {
                                    successCallback();
                                } else if (next) {
                                    nextSearch();
                                }
                            }
                        }

                        function successCallback() {
                            if (_.isFunction(options.success)) {
                                options.success();
                            }
                        }

                        function errorCallback() {
                            if (_.isFunction(options.error)) {
                                options.error();
                            }
                        }
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

                    function hasSearchResult() {
                        return !_.isEmpty(search.result);
                    }

                    function hasResultItems(result) {
                        return _.isObject(result) && _.isArray(result['Items']);
                    }

                    function initSearch(params, searchSource) {
                        search.watch = false;
                        search.params = _.extend({}, npAutokadHelper.getDefaultSearchParams(), params, {
                            source: searchSource || 0
                        });
                    }

                    function doSearch(success, error, blankRequest) {
                        resetSearchRequest();
                        search.requestData = npAutokadHelper.buildSearchRequestData(search.params);

                        if (_.isBlank(search.requestData.q)) {
                            if (_.isFunction(blankRequest)) {
                                blankRequest();
                            }
                        } else {
                            npAutokadHelper.loading(element, function(done){
                                searchRequest(function(hasError, result){
                                    complete(hasError, result);
                                    done();
                                });
                            });
                        }

                        function complete(hasError, result) {
                            hasError = hasError || !hasResultItems(result);

                            if (!hasError) {
                                search.result = result;

                                search.pager.reset(noMore(hasError, result), function(callback){
                                    search.requestData.page++;

                                    npAutokadHelper.loading(element, function(done){
                                        searchRequest(function(hasError, result){
                                            hasError = hasError || !hasResultItems(result);

                                            if (!hasError) {
                                                _.each(result.Items, function(item){
                                                    search.result.Items.push(item);
                                                });
                                            }

                                            callback(noMore(hasError, result));
                                            done();
                                        });
                                    });
                                });

                                if (_.isFunction(success)) {
                                    success();
                                }
                            } else {
                                search.error = true;

                                if (_.isFunction(error)) {
                                    error();
                                }
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
                        search.requestData = npAutokadHelper.getDefaultSearchRequestData();
                    }

                    function clearSearch() {
                        resetSearchRequest();
                        search.pager.reset(true, null);
                        search.result = {};
                        search.noResult = true;
                        search.error = null;
                    }

                    function searchRequest(callback) {
                        search.noResult = true;

                        search.request = npAutokadResource.kadSearch({
                            r: search.requestData,
                            previousRequest: search.request,
                            success: function(data, status){
                                search.noResult = false;
                                search.error = null;
                                callback(false, data.Result);
                            },
                            error: function(data, status){
                                search.noResult = false;
                                search.error = true;
                                callback(true);
                            }
                        });
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
                if (_.isBlank(query) || _.isBlank(text) ||
                    !_.isString(query) || !_.isString(text)) {
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
