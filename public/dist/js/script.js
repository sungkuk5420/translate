function getDataBase(a){firebase.database().ref().on("value",function(t){var e=t.val();DBData=Object.keys(e).map(function(a){return{id:a,data:e[a]}}),a&&a(DBData)})}function pushData(a,t,e,n){if(void 0!=n)return""!==e?t=n.data.ko:""!==t&&(e=n.data.ja),firebase.database().ref().child("/"+n.id).set({sendText:n.data.sendText,ja:e,ko:t}),!1;firebase.database().ref().child("/").push({sendText:a,ja:e,ko:t})}function allTextTranslate(a){function t(a,t){if(void 0!==a){if("ko"==t){if(""==a.data.ko)return!0}else if("ja"==t&&""==a.data.ja)return!0;return!1}return!0}var e="ko",n="ja";"ko"==a&&(e="ja",n="ko"),$("[data-langtext]").each(function(){function r(a,t){"ko"==t?(u=a,f=""):"ja"==t&&(f=a,u=""),pushData(d,f,u,s),i.text(a)}var i=$(this),o=$.trim(i.text()),s=getTextData(o,a);if("ko"==a&&(d=""),t(s,a)){var f=o,u="",d=f;translateAPI(d,e,n,function(a){var t=a.translatedText,e=a.srcLangType;if(d==t)return!1;r(t,e),i.text(t)})}else{var c="ko"==a?s.data.ko:s.data.ja;i.text(c)}})}function translateAPI(a,t,e,n){$.ajax({type:"GET",beforeSend:function(a){a.setRequestHeader("content-type","text/javascript")},url:"/translate",data:{text:a,sendLang:t,returnLang:e},dataType:"json",contentType:"application/json; charset=utf-8",success:function(a){var a=JSON.parse(a);n&&n(a.message.result)}})}function getTextData(a,t){var e=[];return"ko"==t?e=DBData.filter(function(t){return t.data.ja===a}):"ja"==t&&(e=DBData.filter(function(t){return t.data.ko===a})),0!==e.length?e[0]:(0!==(e=DBData.filter(function(t){return t.data.sendText===a})).length&&(""!==e[0].data.ko&&""!==e[0].data.ja||(e=[])),0!==e.length?e[0]:void 0)}function translateInit(){getDataBase(function(){})}var DBData=void 0,config={};firebase.initializeApp(config);