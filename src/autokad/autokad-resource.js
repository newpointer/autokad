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
            resource: {
                'kad.search.url': '/autokad/data/demo/r.json',
            }
        })
        //
        .factory('npAutokadResource', ['$log', '$q', '$http', 'npAutokadResourceConfig', 'npResource', function($log, $q, $http, npAutokadResourceConfig, npResource){

            var config = npAutokadResourceConfig.resource || {};

            // API
            return {
                // TODO реальный запрос, см. data/demo/request.txt
                kadSearch: function(options) {
                    return npResource.request({
                        method: 'GET',
                        url: config['kad.search.url']
                    }, null, options);
                }
            };
        }]);
    //
});
