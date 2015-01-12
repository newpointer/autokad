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
                // url: '/autokad/data/demo/r.json',
                url: '/kad.arbitr.ru/Kad/SearchInstances'
            }
        })
        //
        .factory('npAutokadResource', ['$log', '$q', '$http', 'npAutokadResourceConfig', 'npResource', function($log, $q, $http, npAutokadResourceConfig, npResource){

            var kadSearchConfig = npAutokadResourceConfig['kad.search'];

            // API
            return {
                kadSearch: function(options) {
                    return npResource.request({
                        // docs/autokad.md#%D0%9F%D0%BE%D0%B8%D1%81%D0%BA-%D0%B0%D1%80%D0%B1%D0%B8%D1%82%D1%80%D0%B0%D0%B6%D0%BD%D1%8B%D1%85-%D0%B4%D0%B5%D0%BB
                        // method: 'GET',
                        method: 'POST',
                        url: kadSearchConfig.url,
                        data: _.extend({}, kadSearchConfig.defaultRequestData, {
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
                        }),
                        headers: {
                            "Accept": 'application/json, text/javascript, */*',
                            "Content-Type": 'application/json',
                            "x-date-format": 'iso',
                            "X-Requested-With": 'XMLHttpRequest'
                            // Установить посредством веб-сервера (см. документацию):
                            //  Cookie: *
                            //  Host: *
                            //  Origin: *
                            //  Referer: *
                            // Например, nginx...
                            //  location /kad.arbitr.ru/Kad/ {
                            //      proxy_pass http://kad.arbitr.ru/Kad/;
                            //      proxy_set_header Host kad.arbitr.ru;
                            //      proxy_set_header Origin http://kad.arbitr.ru;
                            //      proxy_set_header Referer http://kad.arbitr.ru/;
                            //      proxy_hide_header Set-Cookie;
                            //  }
                        }
                    }, null, options);
                }
            };
        }]);
    //
});
