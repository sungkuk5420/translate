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
            translateAPI(koText,function(data){
                var jaText = data;
                pushData(koText,jaText);
                $this.text(data);
            });
        }else{
            console.log(translateText.data);
            $this.text(translateText.data.ja);
        }
    })
}
function translateAPI(koText,cb){
    var apiUrl = '';
    var haveData = false;
    if(getTextData(koText) === undefined){
        $.ajax({
            type: 'GET',
            beforeSend: function (request) {
                request.setRequestHeader("content-type", 'text/javascript');
            },
            url: apiUrl+'/translate',
            data : { text : koText},
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(data) {
                console.log('success'+data);
//                  alert(JSON.stringify(data));
                var data =JSON.parse(data);
                // console.log(data);
                var translatedText = data.message.result.translatedText;
                var baseLang = data.message.result.srcLangType;
                // console.log(baseLang);
                if(cb){
                    cb(translatedText);
                }
            }
        });
    }else{
        console.log("이미 데이터가 있습니다.");
        console.log(getTextData(koText).data);
    }

}

function getTextData(text){
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

function translateInit(){
    getDataBase(function(){
        console.log(DBData);
        allTextTranslate();
    });
}