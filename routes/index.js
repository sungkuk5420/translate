var express = require('express');
var router = express.Router();
var translate = require('google-translate-api');


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/translateGoogle', function(req, res, next) {
    console.log(req.query.text);
    console.log(req.query.sendLang);
    console.log(req.query);
    translate(req.query.text, { to: req.query.resultLang }).then(function (response) {
        //res.end(response);
        console.log(response);
        res.end(JSON.stringify(response));
        //io.sockets.emit('message',{sendText:req.query.text,translatedText:response.text});
        ////=> I speak English
        //console.log(res.from.language.iso);
        //=> nl
    }).catch(function (err) {
        console.error(err);
    });
});


// 네이버 Papago NMT API 예제
var client_id = 'SaELp5LuZ87OYdG8LHVt';
var client_secret = 'KOq42k_ftL';
// var query = "とりあえず終わる見込みがあり作業工数が発生しているものはStage設定済み（見積もり対象月の設定）。下記レポートはStageなし（見積もり予定がまだ立っていないもの）の一覧ですので共有させていただきます。";
router.get('/translate', function (req, res) {
    console.log(req.query.text);
    console.log(req.query.sendLang);
    console.log(req.query);
    // var api_url = 'https://openapi.naver.com/v1/language/translate';  // papago smt
    var api_url = 'https://openapi.naver.com/v1/papago/n2mt';// papago nmt
    var request = require('request');
    var options = {
        url: api_url,
        form: {'source':req.query.sendLang, 'target':req.query.resultLang, 'text':req.query.text},
        headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret,'Content-Type':'application/x-www-form-urlencoded'}
    };
    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            console.log(JSON.stringify(body.message));
            //   res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
            res.end(JSON.stringify(body));
        } else {
            res.status(response.statusCode).end();
            console.log('error = ' + response.statusCode);
            console.log('error = ' + JSON.stringify(response));
        }
    });
});

module.exports = router;
