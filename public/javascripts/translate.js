/**
 * Created by pc on 2017/06/20.
 */
var DBData = undefined;
// Initialize Firebase
firebase.initializeApp(config);

var BASELANG = 'ko',
    DATABASE = undefined,
    defaultPath = '/';

var getDataBase = function (cb) {
    return new Promise(function (resolve, reject) {
        DATABASE = firebase.database();
        DATABASE.ref(defaultPath).on('value', function (data) {
            var database = data.val();
            DBData = Object.keys(database).map(function (data) {
                return {
                    id: data,
                    data: database[data]
                };
            });
            if (cb) {
                resolve(DBData);
            }
        });
    });
};

function changeDBText(originalText,changeText,translateTextObj){
    var findLang = "",
        koText = "",
        jaText = "",
        sendText = "";
    if((translateTextObj === undefined) || (translateTextObj === "")){
        var data = getTextData(originalText,'ja');
         translateTextObj = data.data;
        findLang = data.lang;

    }

    if(findLang === 'ko'){
        koText = changeText;
        jaText = translateTextObj.data.ja;
    }else if(findLang === 'ja'){
        jaText = changeText;
        koText = translateTextObj.data.ko;
    }

    if(translateTextObj.data.sendText === originalText) {
        if (BASELANG === 'ko') {
            sendText = changeText;
        } else if (BASELANG === 'ja') {
            sendText = changeText;
        } else {
            sendText = translateTextObj.data.sendText;
        }
    }else {
        sendText = translateTextObj.data.sendText;
    }

    DATABASE.ref(defaultPath).child('/'+translateTextObj.id).set({
        sendText : sendText,
        ja : jaText,
        ko : koText
    });

    $('#txtArea').val("");
    $('.changeTextObj').text(changeText);
    $('#mypopup').removeClass('show');

}


//checKey를 넣으면 2번 검사한다. ex)한글 영어 따로따로 저장함. 안넣으면 입력키가 한글이면 한글에 바로 저장됨.
//autoKey를 넣으면 언어를 자동으로 탐색해준다. 일본어를 넣어서 일본어 번역을 시도할경우 한국어가 나옴. 채팅의 경우 on해주면 좋음.
// textTranslate({
//     sendText : 'aaa',
//     resultLang : 'ja',
//     checKey : true,
//     autoKey : true
// });
function textTranslate(parmas){

    //sendText, resultLang, checkKey, autoKey, cb
    //default lang is ja  ko convert to ja
    var sendLang = BASELANG,
        resultLang = parmas.resultLang === "ko" ? "ko" : "ja",
        checkKey  = parmas.checkKey === true ? true : false,
        autoKey  = parmas.autoKey === true ? true : false;


    if (resultLang == "ko") {
        //ja convert to ko
        sendLang = "ja";
        resultLang = "ko";
    }

    var promiseFunc = function (sendText) {
        console.log(sendText);

        return new Promise(function(resolve, reject) {
            console.log(sendText);
            var translateTextObj = getTextData(sendText, resultLang).data;

            var bl = canTranslateApi(translateTextObj, resultLang);


            if (bl) {
                // if(1){
                var jaText = "";
                translateAPI(sendText, sendLang, resultLang, function (data) {
                    var translatedText = data.translatedText;
                    var baseLang = data.srcLangType;

                    if ((sendText == translatedText)
                        && (autoKey == true)) {

                        //자동번역기능 만들기
                        if (canTranslateApi(getTextData(sendText, sendLang).data, resultLang)) {
                            translateAPI(sendText, resultLang, sendLang, function (data) {
                                var translatedText = data.translatedText;
                                translateCB(translatedText, resultLang, cb);
                            });
                        }

                        return false;
                    }
                    translateCB(translatedText, resultLang);


                });

                function translateCB(translatedText, resultLang) {

                    // console.log("sendText : "+ sendText + "translatedText : " + translatedText + "baseLang : " + baseLang);
                    if (resultLang == "ja") {
                        jaText = translatedText;
                        var koText = checkKey == true ? "" : sendText;
                    } else if (resultLang == "ko") {
                        var koText = translatedText;
                        jaText = checkKey == true ? "" : sendText;
                    }
                    // console.log("koText : " + koText + " jaText :" +jaText);
                    pushData(sendText, koText, jaText, translateTextObj);
                }
            } else {
                console.log("이미 단어가 있습니다 : koText : " + translateTextObj.data.ko + " jaText :" + translateTextObj.data.ja);
                resolve(translateTextObj.data);
            }

            //DATABASE.ref(defaultPath).on('child_added', function(data) {
            //    var database = data.val();
            //    resolve(database);
            //});

            function pushData(sendText,koText,jaText,translateTextObj){
                if((translateTextObj !== undefined) && (translateTextObj !== "")){

                    console.log(translateTextObj);
                    var originalText = "",
                        changeText = "";

                    if(jaText !== ""){
                        changeText = translateTextObj.data.ko;
                    }else if(koText !== ""){
                        changeText = translateTextObj.data.ja;
                    }

                    changeDBText(originalText,changeText,translateTextObj);

                    return false;

                }

                DATABASE.ref(defaultPath).child('/').push({
                    sendText : sendText,
                    ja : jaText,
                    ko : koText
                }, function(error) {
                    if (error){
                        console.log('Error has occured during saving process')
                    }
                    else{
                        console.log("Data hss been saved succesfully");
                        resolve({
                            sendText : sendText,
                            ja : jaText,
                            ko : koText
                        });
                    }
                });
            }
        });


    };

    if(parmas.sendText){
        promiseFunc(parmas.sendText).then(function (translateTextObj) {
            // 성공시
            console.log(translateTextObj);
            if(parmas.cb){
                parmas.cb(translateTextObj);
            }
            BASELANG = parmas.resultLang === "ko" ? "ja" : "ko";
        }, function (error) {
            // 실패시
            console.error(error);
        });
    }else if(parmas.sendText === undefined){
        var textArr = [];
        $('[data-langtext]').each(function() {
            var $this = $(this);
            var thisText = $.trim($this.text());
            textArr.push(thisText);
        });

        recursiveFuc(textArr);

        function recursiveFuc(textArr){

            if(textArr[0] !== undefined){
                promiseFunc(textArr[0]).then(function (translateTextObj) {
                    // 성공시
                    console.log(translateTextObj);
                    var translateText = parmas.resultLang == "ko" ? translateTextObj.ko : translateTextObj.ja;
                    if(parmas.cb){
                        parmas.cb(translateTextObj);
                    }
                    $('[data-langtext]').each(function() {
                        var $this = $(this);
                        var thisText = $.trim($this.text());
                        if(thisText === textArr[0]){
                            $this.text(translateText);
                        }
                    });

                    textArr = removeArray(textArr,textArr[0]);
                    BASELANG = parmas.resultLang === "ko" ? "ja" : "ko";
                    recursiveFuc(textArr);
                }, function (error) {
                    // 실패시
                    console.error(error);
                });
            }

        }

        function removeArray(arr, value){
            var i = arr.length;
            while(i--){
                if( arr[i]
                    &&arr[i] === value  ){

                    arr.splice(i,1);

                }
            }
            return arr;
        }


    }



    function canTranslateApi(translateTextObj,resultLang){

        if((translateTextObj !== undefined) && (translateTextObj !== "")){
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
    var apiUrl = "";
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
    var findLang = "";
    // console.log(DBData);
    if(resultLang == "ko"){
        textData = DBData.filter(function(item){
            return item.data.ja === sendText;
        });
        findLang = 'ja';
    }else if(resultLang == "ja"){
        textData = DBData.filter(function(item){
            return item.data.ko === sendText;
        });
        findLang = 'ko';
    }
    if(textData.length !== 0){
        return {
            data : textData[0],
            lang : findLang
        };
    }else{
        textData = DBData.filter(function(item){
            var itemText = item.data.sendText !== undefined ? $.trim(item.data.sendText) : undefined ;
            return itemText === sendText;
        });
        findLang = 'sendText';

        if(resultLang == "ko"){
            textData = DBData.filter(function(item){
                var itemText = item.data.ko !== undefined ? $.trim(item.data.ko) : undefined ;
                return itemText === sendText;
            });
            findLang = 'ko';
        }else if(resultLang == "ja"){
            textData = DBData.filter(function(item){
                var itemText = item.data.ja !== undefined ? $.trim(item.data.ja) : undefined ;
                return itemText === sendText;
            });
            findLang = 'ja';
        }

        if(textData.length !== 0) {
            if (((resultLang == "ko")&& (textData[0].data.ko === "") )
                || ((resultLang == "ja")&& (textData[0].data.ja === ""))) {
                textData = [];
            }
        }

        if(textData.length === 1){
            return {
                data : textData[0],
                lang : findLang
            };
        }else{
            return {
                data : "",
                lang : ""
            };
        }
    }
}

function translateInit(){

    getDataBase("cbTrue")
        .then(function (DBData) {
            // 성공시
            console.log(DBData);
            addClickCss();
            addPopupHTML();
        }, function (error) {
            // 실패시
            console.error(error);
        });
}

function addClickCss(){
    var cssHTML = "<style type='text/css'> ";
    cssHTML += ".langClickCss:hover{ background-color:#ddd; font-weight:bold; curser: pointer;}";
    cssHTML += " </style>";
    $('head').append(cssHTML);
    $('[data-langtext]').addClass('langClickCss');
    $('.langClickCss').click(function(){
        $(this).addClass('changeTextObj');
        var data = getTextData($.trim($(this).text()),BASELANG);

        console.log(data);
        if(data.data === "" && data.lang === ""){
            alert("DB에 데이터가 없습니다.");
        }else{
            popupOpen($(this).text());
        }
    });
}

function addPopupHTML(){
    var popupHTML = '<div id="mypopup" class="popup-ui"><div class="popup-ui-wrapper"><div class="popup-ui-content"><div class="my-content"><h3 class="textString"></h3><textarea  id="txtArea" rows="4" onkeypress="enterKeyEvent();" ></textarea></div></div></div></div>',
        cssHTML = "<style type='text/css'> ",
        inputCssHTML = "<style type='text/css'> ";

    cssHTML += ".popup-ui { position: fixed; width: 100%; height: 100%; top: 0; left: 0; z-index: 7777; opacity: 0; visibility: hidden; background: rgba(0, 0, 0, 0.5); text-align: center; transition: all 0.2s ease-in-out; }";
    cssHTML += ".popup-ui:before { content: ''; display: inline-block; height: 100%; vertical-align: middle; }";
    cssHTML += ".popup-ui .popup-ui-wrapper { position: relative; display: inline-block; vertical-align: middle; margin: 0 auto; text-align: left; max-width:90%; }";
    cssHTML += ".popup-ui .popup-ui-wrapper .popup-ui-content { position: relative; background: #FFF; padding: 0; width: auto; margin: 0 auto; opacity: 0; visibility: hidden; border: solid 5px #FFF; width:100%; transition: all 0.2s ease-in-out; transform: scale(0.8); box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.5); }";
    cssHTML += ".popup-ui.show { opacity: 1; visibility: visible; }";
    cssHTML += ".popup-ui.show .popup-ui-content { opacity: 1; visibility: visible; transform: scale(1); }";
    cssHTML += ".my-content img { max-width: 100%; height: auto; }";
    cssHTML += ".my-content h3 { padding: 0 10px; font-weight: 300; margin-bottom: 0; }";
    cssHTML += ".my-content p { padding: 0 10px; font-size: 0.9em; }";
    cssHTML += "#btnpopup { display: block; margin: 2em auto 0 auto; width: 200px; }";
    cssHTML += " </style>";

    inputCssHTML = "<style type='text/css'> ";

    inputCssHTML += " #txtArea { width: 100%; margin-top: 10px; padding: 10px;}";
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
            $('.changeTextObj').removeClass('changeTextObj');
        }
    }, false);


}
function popupOpen(textString){
    var POPUP = document.getElementById('mypopup');
    POPUP.className = 'popup-ui  show';

    $('#mypopup').find('.textString').text(textString);
    $('#mypopup').find('.inputForm').attr('placeholder',textString);
}

function enterKeyEvent() {
    var key = window.event.keyCode;
    if (key === 13) {
        if(event.shiftKey){

        }else{
            changeDBText($.trim($('.textString').text()),$.trim($('#txtArea').val()));
            event.preventDefault();
        }


        return false;
    }

}