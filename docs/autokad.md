# autokad

Доступ к агрегированной информации об арбитражных делах
с участием ЮЛ без перехода на сайт [kad.arbitr.ru](http://kad.arbitr.ru/)

[Скриншот сервиса kad.arbitr.ru](../docs/images/kad.arbitr.ru-20141227.png)

Для доступа к данным об арбитражных делах используется внутреннее API
сервиса [kad.arbitr.ru](http://kad.arbitr.ru/)


## Использование API сервиса kad.arbitr.ru

Для использования API сервиса kad.arbitr.ru необходимо:

* Проксировать запросы к API. Проксируемый url: с `/kad.arbitr.ru/Kad/` на `http://kad.arbitr.ru/Kad/`.

* Использовать маскимально идентичные с внутренним API сервиса `kad.arbitr.ru` значения параметров запросов для "симуляции вызова API на стороне `kad.arbitr.ru`"

* Выставить заголовки запросов для "симуляции вызова API на стороне `kad.arbitr.ru`" и "не раскрытия данных стороннего пользователя".
Часть заголовков выставляется в клиентском запросе (см. конретный вызов API).
Часть заголовков необходимо выставить посредством веб-сервера (см. [Настройка веб-сервера](#Настройка веб-сервера)).

* Обработать заголовки ответов для "защиты стороннего пользователя от данных `kad.arbitr.ru`"

### Настройка веб-сервера

#### Настройка nginx

```
location /kad.arbitr.ru/Kad/ {
    proxy_pass          http://kad.arbitr.ru/Kad/;

    proxy_set_header    Host        kad.arbitr.ru;
    proxy_set_header    Origin      http://kad.arbitr.ru;
    proxy_set_header    Referer     http://kad.arbitr.ru/;

    proxy_hide_header   Set-Cookie;
}
```

## API сервиса kad.arbitr.ru

### Поиск арбитражных дел

#### Запрос

```
POST http://kad.arbitr.ru/Kad/SearchInstances

// Специфические заголовки
Accept: application/json, text/javascript, */*
Accept-Encoding: gzip, deflate
Content-Type: application/json
Cookie:__utma=14300007.1560979077.1419681550.1419681550.1419681550.1; __utmz=14300007.1419681550.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); ASP.NET_SessionId=o33wghgnfxi041kx3nsruwki; userId=2bcd95e5-4511-4ecb-8b12-519cbce24a86:s0hOMqJTdq/CE7opFdCBvw==; __utmt=1; __utma=228081543.1213039978.1419665530.1421072267.1421072267.10; __utmb=228081543.2.10.1421072267; __utmc=228081543; __utmz=228081543.1421072267.9.5.utmcsr=localhost:8180|utmccn=(referral)|utmcmd=referral|utmcct=/autokad/src/nkb-app/; aUserId=832fe384-d14c-4bd9-83fb-61aa7182954c:NGEVLG4bQfvBFguC16bdVQ==
x-date-format: iso
X-Requested-With: XMLHttpRequest

// Параметры
{
    // Парметры поиска участника дела (Array<Object>)
    "Sides": [{
        // Наименование участника (ИНН|ОГРН)  (String)
        "Name": "ОАО \"НК \"Роснефть\"",

        // Статус участника (Number):
        //  -1  - Любой
        //  0   - Истец
        //  1   - Ответчик
        //  2   - Третье лицо
        //  3   - Иное лицо
        "Type": -1,

        // Не используем
        "ExactMatch": false
    }],

    // Диапазон дат регистраций дел для поиска (String<ISO 8601 YYYY-MM-DDThh:mm:ss>|null)
    "DateFrom": "2000-12-31T00:00:00",
    "DateTo": "2014-12-01T23:59:59",

    // Номер страницы (Number)
    "Page": 1,

    // Размер страницы (Number)
    // Всегда используем '25' для совместимости
    "Count": 25,

    // Не используем, но оставляем для совместимости
    "Courts": [],
    "Judges": [],
    "CaseNumbers": [],
    "WithVKSInstances": false
}
```

#### Ответ

```
// Специфические заголовки
Cache-Control: private
Content-Encoding: gzip
Content-Type: application/json; charset=utf-8
Last-Modified: Thu, 25 Dec 2014 17:35:00 GMT
Server: Microsoft-IIS/7.5
Set-Cookie:aUserId=f669e384-6e9c-43b5-95c7-6142a5756859:tgumjP5OLcpDFkH6xtQn2w==; domain=.arbitr.ru; expires=Wed, 25-Dec-2024 17:35:00 GMT; path=/; HttpOnly
Set-Cookie:.ASPXAUTH=fixcookie; domain=.kad.arbitr.ru; path=/; expires=Tue, 02-Apr-2012 14:12:08 GMT; HttpOnly
Vary:Accept-Encoding
X-Powered-By:ARR/2.5
X-Powered-By:ASP.NET
X-Powered-By:ASP.NET

// JSON
{
    "Result": {
        // Номер страницы (Number)
        "Page": 1,

        // Размер страницы (Number)
        "PageSize": 25,

        // Кол-во страниц (Number)
        "PagesCount": 3,

        // Всего результатов (Number)
        "TotalCount": 54,

        // Список результатов (Array<Object>)
        "Items":[{
            // Идентификатор (String)
            // Используется для ссылки на страницу дела: http://kad.arbitr.ru/Card/<CaseId>
            "CaseId": "9a561f83-4e04-4b57-b7f4-1d25854dcd0a",

            // Номер дела (String)
            "CaseNumber": "А21-9345/2011",

            // Тип дела (String|null):
            //  "А" - Административные
            //  "Б" - Банкротные
            //  "Г" - Гражданские
            "CaseType": "Г",

            // Наименование суда
            "CourtName": "13 арбитражный апелляционный суд",

            // Судья
            "Judge": "Копылова Л. С.",

            // Дата дела (String<ISO 8601 YYYY-MM-DDThh:mm:ss>)
            "Date": "2012-08-30T00:00:00",

            // Истцы (Object)
            "Plaintiffs": {
                // Кол-во
                "Count": 2,

                // Список истцов (Array<Object>)
                "Participants": [{
                    // Наименование
                    "Name": "ОАО \"НК \"Роснефть\"",

                    // ИНН
                    "Inn": null,

                    // Адрес
                    "Address": "117997, Софийская наб., д. 26/1, г. Москва"
                }, ...]
            },

            // Ответчики (Object)
            "Respondents":{
                // Кол-во
                "Count": 2,

                // Список ответчиков (Array<Object>)
                "Participants":[{
                    // Наименование
                    "Name": "ООО \"СИМ\"",

                    // ИНН
                    "Inn": null,

                    // Адрес
                    "Address": "236039, ул. Б. Хмельницкого, д. 57, г. Калининград"
                }, ...]
            },

            // Не используем
            "IsSimpleJustice": false
        }, ...]
    },

    // Не используем
    "Message": "",
    "Success": true,
    "ServerDate": "2014-12-27T15:51:21"
}

// При ошибке
{
    "Result": null,
    "Message": "внутренняя ошибка сервера",
    "Success": false,
    "ServerDate": "2014-12-25T20:35:00"
}
```
