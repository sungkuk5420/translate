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
    DATABASE.ref().on('child_added', function(data) {
        console.log("추가!!!");
        var database = data.val();
        DBData = Object.keys(database).map(function(data) {
            return {
                id : data,
                data :database[data]
            };
        });
    });

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


//checkKey를 넣으면 2번 검사한다. ex)한글 영어 따로따로 저장함. 안넣으면 입력키가 한글이면 한글에 바로 저장됨.
//autoKey를 넣으면 언어를 자동으로 탐색해준다. 일본어를 넣어서 일본어 번역을 시도할경우 한국어가 나옴. 채팅의 경우 on해주면 좋음.
function textTranslate(parmas){

    //sendText, resultLang, checkKey, autoKey, cb
    //default lang is ja  ko convert to ja
    var sendLang = "ko",
        resultLang = parmas.resultLang === "ko" ? "ko" : "ja",
        checkKey  = parmas.checkKey === true ? true : false,
        autoKey  = parmas.autoKey === true ? true : false;


    if (resultLang == "ko") {
        //ja convert to ko
        sendLang = "ja";
        resultLang = "ko";
    }


    if(parmas.sendText){
        promiseFunc(parmas.sendText,function(translateTextObj){
            if(parmas.cb){
                parmas.cb(translateTextObj);
            }
        });
    }else{
        $('[data-langtext]').each(function() {
            var $this = $(this);
            var thisText = $.trim($this.text());
            promiseFunc(thisText,function(translateTextObj){
                var translateText = parmas.resultLang == "ko" ? translateTextObj.ko : translateTextObj.ja;
                if(parmas.cb){
                    parmas.cb(translateTextObj);
                }
                $this.text(translateText);
            });

        });
    }

    function promiseFunc(sendText,cb){
        var translateTextObj = getTextData(sendText,resultLang);

        var bl = canTranslateApi(translateTextObj,resultLang);


        if(bl){
            // if(1){
            var jaText ="";
            var sendText = sendText;
            translateAPI(sendText,sendLang,resultLang,function(data){
                var translatedText = data.translatedText;
                var baseLang = data.srcLangType;

                if((sendText == translatedText)
                    && (autoKey == true)){

                    //자동번역기능 만들기
                    if(canTranslateApi(getTextData(sendText,sendLang),resultLang)){
                        translateAPI(sendText,resultLang,sendLang,function(data){
                            var translatedText = data.translatedText;
                            translateCB(translatedText,resultLang,cb);
                        });
                    }

                    return false;
                }
                translateCB(translatedText,resultLang,cb);


            });

            function translateCB(translatedText,resultLang,cb){

                // console.log("sendText : "+ sendText + "translatedText : " + translatedText + "baseLang : " + baseLang);
                if(resultLang == "ja"){
                    jaText = translatedText;
                    var koText = checkKey == true ? "" : sendText;
                }else if(resultLang == "ko"){
                    var koText = translatedText;
                    jaText = checkKey == true ? "" : sendText;
                }
                // console.log("koText : " + koText + " jaText :" +jaText);
                pushData(sendText,koText,jaText,translateTextObj);
                if(cb){
                    cb({
                        ko:koText,
                        ja: jaText,
                        resultLang : resultLang
                    });
                }

            }
        }else{
            console.log("이미 단어가 있습니다 : koText : " + translateTextObj.data.ko + " jaText :" + translateTextObj.data.ja);
            if(cb){
                cb(translateTextObj.data);
            }
        }
    }

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


function translateAPI(sendText,sendLang,resultLang,cb){
    console.log(sendText,sendLang,resultLang,cb);
    var apiUrl = '';
    $.ajax({
        type: 'GET',
        beforeSend: function (request) {
            request.setRequestHeader("content-type", 'text/javascript');
        },
        url: apiUrl+'/translate',
        data : { text : sendText, sendLang : sendLang, resultLang : resultLang},
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
    console.log(DBData);
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
            return $.trim(item.data.sendText) === sendText;
        });

        if(resultLang == "ko"){
            textData = DBData.filter(function(item){
                return $.trim(item.data.ko) === sendText;
            });
        }else if(resultLang == "ja"){
            textData = DBData.filter(function(item){
                return $.trim(item.data.ja) === sendText;
            });
        }

        if(textData.length !== 0) {
            if (((resultLang == "ko")&& (textData[0].data.ko === "") )
                || ((resultLang == "ja")&& (textData[0].data.ja === ""))) {
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
        addClickCss();
        addPopupHTML();
        // allTextTranslate();
    });
}

function addClickCss(){
    var cssHTML = "<style type='text/css'> ";
    cssHTML += ".langClickCss:hover{ background-color:#ddd; font-weight:bold; curser: pointer;}";
    cssHTML += " </style>";
    $('head').append(cssHTML);
    $('[data-langtext]').addClass('langClickCss');
    $('.langClickCss').click(function(){
        popupOpen($(this).text());
    });
}

function addPopupHTML(){
    var popupHTML = '<div id="mypopup" class="popup-ui"><div class="popup-ui-wrapper"><div class="popup-ui-content"><div class="my-content"><h3 class="textString"></h3><input class="inputForm"></div></div></div></div>"',
        cssHTML = "<style type='text/css'> ",
        inputCssHTML = "<style type='text/css'> ";

    cssHTML += ".popup-ui { position: fixed; width: 100%; height: 100%; top: 0; left: 0; z-index: 7777; opacity: 0; visibility: hidden; background: rgba(0, 0, 0, 0.5); text-align: center; transition: all 0.2s ease-in-out; }";
    cssHTML += ".popup-ui:before { content: ''; display: inline-block; height: 100%; vertical-align: middle; }";
    cssHTML += ".popup-ui .popup-ui-wrapper { position: relative; display: inline-block; vertical-align: middle; margin: 0 auto; text-align: left; }";
    cssHTML += ".popup-ui .popup-ui-wrapper .popup-ui-content { position: relative; background: #FFF; padding: 0; width: auto; margin: 0 auto; opacity: 0; visibility: hidden; border: solid 5px #FFF; max-width: 90%; transition: all 0.2s ease-in-out; transform: scale(0.8); box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.5); }";
    cssHTML += ".popup-ui.show { opacity: 1; visibility: visible; }";
    cssHTML += ".popup-ui.show .popup-ui-content { opacity: 1; visibility: visible; transform: scale(1); }";
    cssHTML += ".my-content img { max-width: 100%; height: auto; }";
    cssHTML += ".my-content h3 { padding: 0 10px; font-weight: 300; margin-bottom: 0; }";
    cssHTML += ".my-content p { padding: 0 10px; font-size: 0.9em; }";
    cssHTML += "#btnpopup { display: block; margin: 2em auto 0 auto; width: 200px; }";
    cssHTML += " </style>";

    cssHTML = "<style type='text/css'> ";

    inputCssHTML += ".popup-ui { position: fixed; width: 100%; height: 100%; top: 0; left: 0; z-index: 7777; opacity: 0; visibility: hidden; background: rgba(0, 0, 0, 0.5); text-align: center; transition: all 0.2s ease-in-out; }";
    inputCssHTML += ".popup-ui:before { content: ''; display: inline-block; height: 100%; vertical-align: middle; }";
    inputCssHTML += ".popup-ui .popup-ui-wrapper { position: relative; display: inline-block; vertical-align: middle; margin: 0 auto; text-align: left; }";
    inputCssHTML += ".popup-ui .popup-ui-wrapper .popup-ui-content { position: relative; background: #FFF; padding: 0; width: auto; margin: 0 auto; opacity: 0; visibility: hidden; border: solid 5px #FFF; max-width: 90%; transition: all 0.2s ease-in-out; transform: scale(0.8); box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.5); }";
    inputCssHTML += ".popup-ui.show { opacity: 1; visibility: visible; }";
    inputCssHTML += ".popup-ui.show .popup-ui-content { opacity: 1; visibility: visible; transform: scale(1); }";
    inputCssHTML += ".my-content img { max-width: 100%; height: auto; }";
    inputCssHTML += ".my-content h3 { padding: 0 10px; font-weight: 300; margin-bottom: 0; }";
    inputCssHTML += ".my-content p { padding: 0 10px; font-size: 0.9em; }";
    inputCssHTML += "#btnpopup { display: block; margin: 2em auto 0 auto; width: 200px; }";
    inputCssHTML += " </style>";

    $('body').append(popupHTML);
    $('head').append(cssHTML);
    $('head').append(inputCssHTML);

    // js binding
    var BUTTON = document.getElementById('btnpopup');
    var POPUP = document.getElementById('mypopup');

    // Popup modal (Click on modal to close it)
    POPUP.addEventListener('click', function(){
        if($(event.target).closest('.popup-ui-wrapper').length == 0){
            this.className = 'popup-ui';
        }
    }, false);
}
function popupOpen(textString){
    var POPUP = document.getElementById('mypopup');
    POPUP.className = 'popup-ui  show';

    $('#mypopup').find('.textString').text(textString);
    $('#mypopup').find('.inputForm').attr('placeholder',textString);
}
