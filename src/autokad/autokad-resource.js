/**
 * @module rsearch-resource
 * @desc RequireJS/Angular module
 * @author ankostyuk
 */
define(function(require) {'use strict';

                  require('lodash');
    var angular = require('angular');
                  require('resource');

    return angular.module('np.autokad-resource', ['np.resource'])
        //
        .constant('npAutokadResourceConfig', {
            'kad.search': {
                // url: '/autokad/data/demo/r.json'
                url: '/kad.arbitr.ru/Kad/SearchInstances'
            }
        })
        //
        .factory('npAutokadResource', ['$log', '$q', '$http', 'npAutokadResourceConfig', 'npResource', function($log, $q, $http, npAutokadResourceConfig, npResource){

            var kadSearchConfig = npAutokadResourceConfig['kad.search'];

            // API
            return {
                kadSearch: function(options) {
                    // docs/autokad.md#Поиск арбитражных дел
                    return npResource.request({
                        // method: 'GET',
                        method: 'POST',
                        url: kadSearchConfig.url,
                        data: {
                            "Sides": [{
                                "Name": options.r.q,
                                "Type": -1,
                                "ExactMatch": false
                            }],
                            "CaseType": options.r.caseType !== 'any' ? options.r.caseType : undefined,
                            "DateFrom": options.r.dateFrom || null,
                            "DateTo": options.r.dateTo || null,
                            "Page": options.r.page || 1,
                            "Count": 25,
                            "Courts": [],
                            "Judges": [],
                            "CaseNumbers": [],
                            "WithVKSInstances": false
                        },
                        headers: {
                            "Accept": 'application/json, text/javascript, */*',
                            "Content-Type": 'application/json',
                            "x-date-format": 'iso',
                            "X-Requested-With": 'XMLHttpRequest'
                        }
                    }, {
                        responseProcess: function(data) {
                            if (_.isEmpty(data.Result)) {
                                $log.warn('kadSearch... <Result> is empty:', data);
                            }
                            return data;
                        }
                    }, options);
                }
            };
        }]);
    //
});
