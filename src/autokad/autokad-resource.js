/**
 * @module rsearch-resource
 * @desc RequireJS/Angular module
 * @author ankostyuk
 */
define(function(require) {'use strict';

                  require('underscore');
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
                            "DateFrom": options.r.dateFrom,
                            "DateTo": options.r.dateTo,
                            "Page": options.r.page,
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
                    }, null, options);
                }
            };
        }]);
    //
});
