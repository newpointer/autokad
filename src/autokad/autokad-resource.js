/**
 * @module rsearch-resource
 * @desc RequireJS/Angular module
 * @author ankostyuk
 */
define(function(require) {'use strict';

                  require('lodash');
    var angular = require('angular');
                  require('np.resource');

    return angular.module('np.autokad-resource', ['np.resource'])
        //
        .constant('npAutokadResourceConfig', {
            'kad.search': {
                url: '/autokad/data/demo/r.html'
                // url: '/kad.arbitr.ru/Kad/SearchInstances'
            }
        })
        //
        .factory('npAutokadResource', ['$log', '$q', '$http', 'npAutokadResourceConfig', 'npResource', function($log, $q, $http, npAutokadResourceConfig, npResource){

            var kadSearchConfig = npAutokadResourceConfig['kad.search'];

            //
            var CaseTypeByClass = {
                'administrative':   'А',
                'civil':            'Г',
                'bankruptcy':       'Б'
            };

            function isContentTypeHeaderAs(headers, contentType) {
                var targetContentType = headers('Content-Type');

                if (!targetContentType || !contentType) {
                    return null;
                }

                return (targetContentType.toLowerCase()).indexOf(contentType.toLowerCase()) >= 0;
            }

            function parseKadSearchHTMLResult(htmlData) {
                var data        = {},
                    $htmlData   = $(htmlData),
                    total       = parseInt($htmlData.find('#documentsTotalCount').val());

                $log.info('total:', total);

                if (_.isNaN(total)) {
                    return data;
                }

                var items = [];

                $htmlData.find('> tr').each(function(){
                    var $row        = $(this),
                        $num        = $row.find('> .num > .b-container'),
                        $caseType   = $num.find('> div:first-child'),
                        $caseLink   = $num.find('a'),
                        $court      = $row.find('> .court > .b-container');

                    var item = {
                        "CaseId":       _.last(_.words($caseLink.attr('href'), '/')),
                        "CaseNumber":   _.trim($caseLink.text()),
                        "CaseType":     CaseTypeByClass[$caseType.attr('class')],
                        "CourtName":    _.trim($court.find('> div:last-child').text()),
                        "Judge":        _.trim($court.find('.judge').text()),
                        "Date":         _.trim($caseType.find('> span').text())
                    };

                    $log.info('item:', item);

                    items.push(item);
                });

                var result = data['Result'] = {
                    "Page":         parseInt($htmlData.find('#documentsPage').val()),
                    "PageSize":     parseInt($htmlData.find('#documentsPageSize').val()),
                    "PagesCount":   parseInt($htmlData.find('#documentsPagesCount').val()),
                    "TotalCount":   total,
                    "Items":        items
                };

                function getCaseTypeByClass() {

                }

                return data;
            }

            // API
            return {
                kadSearch: function(options) {
                    // docs/autokad.md#Поиск арбитражных дел
                    return npResource.request({
                        method: 'GET',
                        // method: 'POST',
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
                            "Accept": '*/*',
                            "Content-Type": 'application/json',
                            "x-date-format": 'iso',
                            "X-Requested-With": 'XMLHttpRequest'
                        }
                    }, {
                        responseProcess: function(data, status, headers, config) {
                            $log.info('success...', headers('Content-Type'));

                            if (isContentTypeHeaderAs(headers, 'text/html')) {
                                $log.warn('HTML...');
                                data = parseKadSearchHTMLResult(data);
                            }

                            if (_.isEmpty(data['Result'])) {
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
