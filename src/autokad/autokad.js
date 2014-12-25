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
        angular         = require('angular');

    var submodules = {
        autokadResource:    require('./autokad-resource'),
    };

    return angular.module('np.autokad', _.pluck(submodules, 'name'))
        //
        .run([function(){
            template = i18n.translateTemplate(template);
        }])
        //
        .directive('npAutokad', ['$log', 'npAutokadResource', function($log, npAutokadResource){
            return {
                restrict: 'A',
                template: template,
                scope: {},
                link: function(scope, element, attrs) {
                    var kadSearchRequest;

                    kadSearch();

                    function kadSearch() {
                        kadSearchRequest = npAutokadResource.kadSearch({
                            q: null,
                            previousRequest: kadSearchRequest,
                            success: function(data, status){
                                $log.log('success...', data);
                            },
                            error: function(data, status){
                                $log.warn('success...');
                            }
                        });

                        kadSearchRequest.completePromise.then(function(){
                            console.log('kadSearchRequest complete');
                        });
                    }
                }
            };
        }]);
    //
});
