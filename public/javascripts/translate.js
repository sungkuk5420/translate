/**
 * Created by pc on 2017/06/20.
 */
var DBData = undefined;
// Initialize Firebase
var config = {
};
firebase.initializeApp(config);

function getDataBase(cb){
    var DATABASE = firebase.database();
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
function pushData(sendText,koText,jaText,translateTextObj){
    if(translateTextObj != undefined){

        console.log(translateTextObj);
        if(jaText !== ""){
            koText = translateTextObj.data.ko;
        }else if(koText !== ""){
            jaText = translateTextObj.data.ja;
        }

        firebase.database().ref().child('/'+translateTextObj.id).set({
            sendText : translateTextObj.data.sendText,
            ja : jaText,
            ko : koText
        });

        return false;

    }

    firebase.database().ref().child('/').push({
        sendText : sendText,
        ja : jaText,
        ko : koText
    });
}



function allTextTranslate(resultLang){
    //default lang is ja  ko convert to ja
    var sendLang = "ko",
        returnLang = "ja";


    if (resultLang == "ko") {
        //ja convert to ko
        sendLang = "ja",
        returnLang = "ko";
    }
    $('[data-langtext]').each(function() {
        var $this = $(this);
        var thisText = $.trim($this.text());
        var translateTextObj = getTextData(thisText,resultLang);

        if (resultLang == "ko") {
            sendText = "";
        }

        var bl = canTranslateApi(translateTextObj,resultLang);


        if(bl){
            // if(1){
            var koText = thisText;
            var jaText ="";
            var sendText = koText;
            translateAPI(sendText,sendLang,returnLang,function(data){
                var translatedText = data.translatedText;
                var baseLang = data.srcLangType;

                if(sendText == translatedText){

                    //자동번역기능 만들기
                    // if(canTranslateApi(getTextData(sendText,sendLang),returnLang)){
                    //     translateAPI(sendText,returnLang,sendLang,function(data){
                    //         var translatedText = data.translatedText;
                    //         var baseLang = data.srcLangType;
                    //         translateCB(translatedText,baseLang);
                    //         $this.text(translatedText);
                    //     });
                    // }

                    return false;
                }
                translateCB(translatedText,baseLang);
                $this.text(translatedText);
            });

            function translateCB(translatedText,baseLang){

                // console.log("sendText : "+ sendText + "translatedText : " + translatedText + "baseLang : " + baseLang);
                if(baseLang == "ko"){
                    jaText = translatedText;
                    koText = "";
                }else if(baseLang == "ja"){
                    koText = translatedText;
                    jaText = "";
                }
                // console.log("koText : " + koText + " jaText :" +jaText);
                pushData(sendText,koText,jaText,translateTextObj);
                $this.text(translatedText);
            }
        }else{
            console.log("이미 단어가 있습니다 : koText : " + translateTextObj.data.ko + " jaText :" + translateTextObj.data.ja);
            var translateText = resultLang == "ko" ? translateTextObj.data.ko : translateTextObj.data.ja;
            $this.text(translateText);
        }
    })

    function canTranslateApi(translateTextObj,resultLang){

        if(translateTextObj !== undefined){
            if (resultLang == "ko") {
                if(translateTextObj.data.ko == ""){
                    return true;
                }

            }else if (resultLang == "ja"){
                if(translateTextObj.data.ja == ""){
                    return true;
                }
            }
            return false;
        }

        return true;

    }


}
function translateAPI(sendText,sendLang,returnLang,cb){
    var apiUrl = '';
    $.ajax({
        type: 'GET',
        beforeSend: function (request) {
            request.setRequestHeader("content-type", 'text/javascript');
        },
        url: apiUrl+'/translate',
        data : { text : sendText, sendLang : sendLang, returnLang : returnLang},
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            // console.log('success'+data);
            var data =JSON.parse(data);
            if(cb){
                cb(data.message.result);
            }
        }
    });

}

// function getTextData(text){
//     var textData = DBData.filter(function(item){
//         return item.data.ko === text;
//     });
//
//     if(textData.length === 0){
//         textData = DBData.filter(function(item){
//             return item.data.ja === text;
//         });
//     }
//
//     if(textData.length === 0){
//         textData = DBData.filter(function(item){
//             return item.data.sendText === text;
//         });
//     }
//
//     if(textData.length !== 0){
//         return textData[0];
//     }else{
//         return undefined;
//     }
// }

function getTextData(sendText,resultLang){
    var textData = [];
    if(resultLang == "ko"){
        textData = DBData.filter(function(item){
            return item.data.ja === sendText;
        });
    }else if(resultLang == "ja"){
        textData = DBData.filter(function(item){
            return item.data.ko === sendText;
        });
    }
    if(textData.length !== 0){
        return textData[0];
    }else{
        textData = DBData.filter(function(item){
            return item.data.sendText === sendText;
        });

        if(textData.length !== 0) {
            if ((textData[0].data.ko === "")
                || (textData[0].data.ja === "")) {
                textData = [];
            }
        }

        if(textData.length !== 0){
            return textData[0];
        }else{
            return undefined;
        }
    }
}

function translateInit(){
    getDataBase(function(){
        console.log(DBData);
        // allTextTranslate();
    });
}