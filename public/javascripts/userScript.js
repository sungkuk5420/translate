/**
 * Created by pc on 2017/06/20.
 */
var DBData = undefined;
// Initialize Firebase
var config = {
};
firebase.initializeApp(config);
DATABASE = firebase.database();
function getDataBase(cb){
    DATABASE.ref().on('value', function(data) {
        var database = data.val();
        DBData = Object.keys(database).map(function(data) {
            return {
                id : data,
                data :database[data]
            };
        });
        if(cb){
            cb(DBData);
        }
    });
}
function pushData(koText,jaText){
    firebase.database().ref().child('/').push({
        ja : jaText,
        ko : koText
    });
}
function allTextTranslate(){
    $('[data-langtext]').each(function() {
        var $this = $(this);
        var thisText = $.trim($this.text());
        var translateText = getTextData(thisText);

        if(translateText === undefined){
            var koText = thisText;
            translate(koText,function(data){
                var jaText = data;
                pushData(koText,jaText);
                $this.text(data);
            });
        }else{
            console.log(translateText.data);
            $this.text(translateText.data.ja);
        }

//              var searchIndex = arrayObjectIndexOf($.lang,$this.text(),nowLanguage);
//              if(searchIndex != -1){
//                  $this.html($.lang[searchIndex][currentLanguage]);
//              }else{
//                  console.log($this.text());
//              }
    })
}
function translate(Text,cb){
//          var apiUrl = 'http://ec2-52-68-168-194.ap-northeast-1.compute.amazonaws.com';
    var apiUrl = '';
    if(Text == undefined){
        var Text = "とりあえず終わる見込みがあり作業工数が発生しているものはStage設定済み（見積もり対象月の設定）。下記レポートはStageなし（見積もり予定がまだ立っていないもの）の一覧ですので共有させていただきます。";
    }
    $.ajax({
        type: 'GET',
        beforeSend: function (request) {
            request.setRequestHeader("content-type", 'text/javascript');
        },
        url: apiUrl+'/translate',
        data : { text : Text},
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            console.log('success'+data);
//                  alert(JSON.stringify(data));
            var data =JSON.parse(data);
            console.log(data);
            var translatedText = data.message.result.translatedText;
            var baseLang = data.message.result.srcLangType;
            console.log(baseLang);
            if(cb){
                cb(translatedText);
            }
        }
    });
}

function getTextData(text){
//            for(var i=0,len = DBData.length ; i < len ; i++){
//                var currentData = DBData[i].data;
//                console.log(currentData);
//
//            }
    var textData = DBData.filter(function(item){
        return item.data.ko === text;
    });

    if(textData.length === 0){
        textData = DBData.filter(function(item){
            return item.data.ja === text;
        });
    }

    if(textData.length !== 0){
        return textData[0];
    }else{
        return undefined;
    }
}
