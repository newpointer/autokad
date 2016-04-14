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
                // url: '/autokad/data/demo/r.html'
                // url: '/autokad/data/demo/r-empty.html'
                // url: '/autokad/data/demo/r-fail-1.html'
                // url: '/autokad/data/demo/r-fail-2.html'
                url: '/kad.arbitr.ru/Kad/SearchInstances'
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
                var $htmlData = $('<div>', {
                    html: htmlData
                });

                var data        = {},
                    total       = parseInt($htmlData.find('#documentsTotalCount').val());

                if (_.isNaN(total)) {
                    return data;
                }

                var items = [];

                $htmlData.find('tr').each(function(){
                    var $row            = $(this),
                        $num            = $row.find('> .num > .b-container'),
                        $caseType       = $num.find('> div:first-child'),
                        $caseLink       = $num.find('a'),
                        $court          = $row.find('> .court > .b-container'),
                        plaintiffCount  = parseInt(_.clean($row.find('.plaintiff .b-button-container .b-button strong').text())),
                        respondentCount = parseInt(_.clean($row.find('.respondent .b-button-container .b-button strong').text())),
                        plaintiffs      = [],
                        respondents     = [];

                    $row.find('.plaintiff .js-rolloverHtml').each(function(){
                        plaintiffs.push(buildParticipant($(this)));
                    });

                    $row.find('.respondent .js-rolloverHtml').each(function(){
                        respondents.push(buildParticipant($(this)));
                    });

                    var item = {
                        "CaseId":       _.last(_.words($caseLink.attr('href'), '/')),
                        "CaseNumber":   _.clean($caseLink.text()),
                        "CaseType":     CaseTypeByClass[$caseType.attr('class')],
                        "CourtName":    _.clean($court.find('> div:last-child').text()),
                        "Judge":        _.clean($court.find('.judge').text()),
                        "Date":         _.clean($caseType.find('> span').text()),
                        "Plaintiffs":   {
                            "Count": plaintiffCount || _.size(plaintiffs),
                            "Participants": plaintiffs
                        },
                        "Respondents":  {
                            "Count": respondentCount || _.size(respondents),
                            "Participants": respondents
                        }
                    };

                    function buildParticipant($p) {
                        return {
                            "Name":     _.clean($p.find('strong').text()),
                            "Inn":      _.clean(_.replaceAll($p.find('div:contains("ИНН")').text(), 'ИНН:', '')),
                            "Address":  _.clean($p.clone().children().remove().end().text())
                        };
                    }

                    items.push(item);
                });

                data["Result"] = {
                    "Page":         parseInt($htmlData.find('#documentsPage').val()) || null,
                    "PageSize":     parseInt($htmlData.find('#documentsPageSize').val()) || null,
                    "PagesCount":   parseInt($htmlData.find('#documentsPagesCount').val()) || null,
                    "TotalCount":   total,
                    "Items":        items
                };

                return data;
            }

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
                            "Accept": '*/*',
                            "Content-Type": 'application/json',
                            "x-date-format": 'iso',
                            "X-Requested-With": 'XMLHttpRequest'
                        }
                    }, {
                        responseProcess: function(data, status, headers, config) {
                            if (isContentTypeHeaderAs(headers, 'text/html')) {
                                data = parseKadSearchHTMLResult(data);
                            }

                            if (_.isEmpty(data["Result"])) {
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
