(function(e){function n(n){for(var t,a,i=n[0],u=n[1],s=n[2],d=0,l=[];d<i.length;d++)a=i[d],Object.prototype.hasOwnProperty.call(c,a)&&c[a]&&l.push(c[a][0]),c[a]=0;for(t in u)Object.prototype.hasOwnProperty.call(u,t)&&(e[t]=u[t]);f&&f(n);while(l.length)l.shift()();return o.push.apply(o,s||[]),r()}function r(){for(var e,n=0;n<o.length;n++){for(var r=o[n],t=!0,a=1;a<r.length;a++){var i=r[a];0!==c[i]&&(t=!1)}t&&(o.splice(n--,1),e=u(u.s=r[0]))}return e}var t={},a={app:0},c={app:0},o=[];function i(e){return u.p+"js/"+({"piping-ui-auth":"piping-ui-auth"}[e]||e)+"."+{"chunk-2d0a429b":"7f586df9","chunk-2d0c0332":"43953bd1","chunk-2d0c7b81":"e2b2c654","chunk-2d0ccfb8":"1720c152","chunk-2d0d75dd":"9b7e6cf4","chunk-2d2100ac":"eecc003d","chunk-6e83591c":"61d6401d","chunk-2d217155":"30109164","chunk-f311c04a":"38ce4948","chunk-61e68bee":"e51193dc","chunk-27989818":"78d97f3b","chunk-b9033c88":"c9b8eded","chunk-b3e37474":"990389da","chunk-1c070a76":"4a07190e","chunk-2852a8b2":"3629e38c","chunk-2d2073a3":"cdd7c728","chunk-64a82e9a":"293f1ca2","chunk-c93e2486":"bf68759b","chunk-1799178c":"bcaf7444","chunk-2d0b1f6a":"f832ef36","piping-ui-auth":"95e887d4","chunk-221256f0":"800f8cfe","chunk-2d21e767":"64fb48df"}[e]+".js"}function u(n){if(t[n])return t[n].exports;var r=t[n]={i:n,l:!1,exports:{}};return e[n].call(r.exports,r,r.exports,u),r.l=!0,r.exports}u.e=function(e){var n=[],r={"chunk-f311c04a":1,"chunk-61e68bee":1,"chunk-b9033c88":1,"chunk-2852a8b2":1,"chunk-64a82e9a":1};a[e]?n.push(a[e]):0!==a[e]&&r[e]&&n.push(a[e]=new Promise((function(n,r){for(var t="css/"+({"piping-ui-auth":"piping-ui-auth"}[e]||e)+"."+{"chunk-2d0a429b":"31d6cfe0","chunk-2d0c0332":"31d6cfe0","chunk-2d0c7b81":"31d6cfe0","chunk-2d0ccfb8":"31d6cfe0","chunk-2d0d75dd":"31d6cfe0","chunk-2d2100ac":"31d6cfe0","chunk-6e83591c":"31d6cfe0","chunk-2d217155":"31d6cfe0","chunk-f311c04a":"87879f53","chunk-61e68bee":"f21b305c","chunk-27989818":"31d6cfe0","chunk-b9033c88":"e6a9ac71","chunk-b3e37474":"31d6cfe0","chunk-1c070a76":"31d6cfe0","chunk-2852a8b2":"521174f2","chunk-2d2073a3":"31d6cfe0","chunk-64a82e9a":"29134752","chunk-c93e2486":"31d6cfe0","chunk-1799178c":"31d6cfe0","chunk-2d0b1f6a":"31d6cfe0","piping-ui-auth":"31d6cfe0","chunk-221256f0":"31d6cfe0","chunk-2d21e767":"31d6cfe0"}[e]+".css",c=u.p+t,o=document.getElementsByTagName("link"),i=0;i<o.length;i++){var s=o[i],d=s.getAttribute("data-href")||s.getAttribute("href");if("stylesheet"===s.rel&&(d===t||d===c))return n()}var l=document.getElementsByTagName("style");for(i=0;i<l.length;i++){s=l[i],d=s.getAttribute("data-href");if(d===t||d===c)return n()}var f=document.createElement("link");f.rel="stylesheet",f.type="text/css",f.onload=n,f.onerror=function(n){var t=n&&n.target&&n.target.src||c,o=new Error("Loading CSS chunk "+e+" failed.\n("+t+")");o.code="CSS_CHUNK_LOAD_FAILED",o.request=t,delete a[e],f.parentNode.removeChild(f),r(o)},f.href=c;var p=document.getElementsByTagName("head")[0];p.appendChild(f)})).then((function(){a[e]=0})));var t=c[e];if(0!==t)if(t)n.push(t[2]);else{var o=new Promise((function(n,r){t=c[e]=[n,r]}));n.push(t[2]=o);var s,d=document.createElement("script");d.charset="utf-8",d.timeout=120,u.nc&&d.setAttribute("nonce",u.nc),d.src=i(e);var l=new Error;s=function(n){d.onerror=d.onload=null,clearTimeout(f);var r=c[e];if(0!==r){if(r){var t=n&&("load"===n.type?"missing":n.type),a=n&&n.target&&n.target.src;l.message="Loading chunk "+e+" failed.\n("+t+": "+a+")",l.name="ChunkLoadError",l.type=t,l.request=a,r[1](l)}c[e]=void 0}};var f=setTimeout((function(){s({type:"timeout",target:d})}),12e4);d.onerror=d.onload=s,document.head.appendChild(d)}return Promise.all(n)},u.m=e,u.c=t,u.d=function(e,n,r){u.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:r})},u.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},u.t=function(e,n){if(1&n&&(e=u(e)),8&n)return e;if(4&n&&"object"===typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(u.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var t in e)u.d(r,t,function(n){return e[n]}.bind(null,t));return r},u.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return u.d(n,"a",n),n},u.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},u.p="",u.oe=function(e){throw console.error(e),e};var s=window["webpackJsonp"]=window["webpackJsonp"]||[],d=s.push.bind(s);s.push=n,s=s.slice();for(var l=0;l<s.length;l++)n(s[l]);var f=d;o.push([0,"chunk-vendors"]),r()})({0:function(e,n,r){e.exports=r("cd49")},"034f":function(e,n,r){"use strict";var t=r("8a23"),a=r.n(t);a.a},1579:function(e,n,r){"use strict";r.d(n,"a",(function(){return i}));r("99af"),r("d3b7"),r("2ca0"),r("96cf");var t=r("1da1"),a=r("f212"),c=function(){return r.e("chunk-2d0ccfb8").then(r.t.bind(null,"4ff6",7)).then((function(e){return e.default}))},o=function(){return Promise.resolve().then(r.bind(null,"7dda"))};function i(e){return e.startsWith("en")?u:e.startsWith("ja")?d:s}var u={language:"Language",dark_theme:"Dark Theme",pwa_update:"Update",version:"Version: ".concat(a["a"]),view_on_github:"View source code on GitHub",open_source_licenses:"Open source licenses",close:"Close",send:"Send",get:"Get",text_mode:"Text mode",text_placeholder:"Text",server_url:"Server URL",secret_path:"Secret path",secret_path_placeholder:"e.g. mypath374",drop_a_file_here_or_browse:"Drop a file here or <span class='filepond--label-action'>Browse</span>",protect_with_password:"Protect with password",passwordless_protection:"Passwordless",password:"Password",password_is_required:"Password is required",view:"View",download:"Download",error_file_not_selected:"Error: File not selected",error_secret_path_not_specified:"Error: Secret path not specified",upload:"Upload",waiting_for_receiver:"Waiting for receiver...",verification_code:"Verification code",verify_and_send:"Verify & Send",key_exchange_error:function(e){switch(e){case"invalid_parcel_format":return"Parcel format is invalid.";case"different_key_exchange_version":return"Key exchange versions are different. Please update your app or peer's app."}},sender_not_verified:"Sender not verified",upload_url:"Upload URL",compressing:"Compressing...",encrypting:"Encrypting...",data_uploader_xhr_onerror:function(){var e=Object(t["a"])(regeneratorRuntime.mark((function e(n){var r,t,a;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,o();case 2:return r=e.sent,e.next=5,c();case 5:return t=e.sent,a=t(n.serverUrl,"/version"),e.abrupt("return",r.sanitizeHtmlAllowingATag('An error occurred. The server might be < 0.9.4. Please check <a href="'.concat(a,'" target="_blank">').concat(a,"</a>")));case 8:case"end":return e.stop()}}),e)})));function n(n){return e.apply(this,arguments)}return n}(),data_uploader_xhr_upload_onerror:"An error occurred while uploading",cancel:"Cancel",view_in_viewer:"View",download_url:"Download URL",waiting_for_sender:"Waiting for sender...",decrypting:"Decrypting...",copied:"Copied",password_might_be_wrong:"The password might be wrong",reinput_password:"Reinput password",unlock:"Unlock",view_raw:"View raw",xhr_status_error:function(e){return"Error (".concat(e.status,'): "').concat(e.response,'"')},data_viewer_xhr_onerror:"Download error",save:"Save",record_server_url:"Record server URL",record_secret_path:"Record secret path",download_in_downloader:"Download"},s=u,d={language:"言語 (Language)",dark_theme:"ダークテーマ",pwa_update:"Update",version:"バージョン: ".concat(a["a"]),view_on_github:"GitHubでソースコードを見る",open_source_licenses:"オープンソース ライセンス",close:"閉じる",send:"送信",get:"受信",text_mode:"テキスト",text_placeholder:"テキスト",server_url:"サーバー",secret_path:"転送パス",secret_path_placeholder:"例: mypath374, あいう123",drop_a_file_here_or_browse:"ファイルをドラッグするか<span class='filepond--label-action'>開く</span>",protect_with_password:"パスワードで保護",passwordless_protection:"パスワードレス",password:"パスワード",password_is_required:"パスワードを入力してください",view:"見る",download:"ダウンロード",error_file_not_selected:"エラー: ファイルが選択されていません",error_secret_path_not_specified:"エラー: 転送パスが指定されていません",upload:"アップロード",waiting_for_receiver:"受信者を待機中...",verification_code:"確認コード",verify_and_send:"確認完了",key_exchange_error:function(e){switch(e){case"invalid_parcel_format":return"パーセルのフォーマットが不正です。";case"different_key_exchange_version":return"鍵交換のバージョンが異なります。このアプリを更新するか通信相手のアプリを更新してください。"}},sender_not_verified:"送信者が拒否しました",upload_url:"アップロードURL",compressing:"圧縮中...",encrypting:"暗号化中...",data_uploader_xhr_onerror:function(){var e=Object(t["a"])(regeneratorRuntime.mark((function e(n){var r,t,a;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,o();case 2:return r=e.sent,e.next=5,c();case 5:return t=e.sent,a=t(n.serverUrl,"/version"),e.abrupt("return",r.sanitizeHtmlAllowingATag('エラーが発生しました。サーバーが0.9.4より低い可能性があります。 <a href="'.concat(a,'" target="_blank">').concat(a,"</a> でバージョンの確認できます。")));case 8:case"end":return e.stop()}}),e)})));function n(n){return e.apply(this,arguments)}return n}(),data_uploader_xhr_upload_onerror:"アップロード中にエラが発生しました",cancel:"キャンセル",view_in_viewer:"表示",decrypting:"復号中...",download_url:"ダウンロードURL",waiting_for_sender:"送信者を待機中...",copied:"コピーされました",password_might_be_wrong:"パスワードが間違っている可能性があります",reinput_password:"パスワードを再入力",unlock:"解除",view_raw:"解除せずに見る",xhr_status_error:function(e){return"エラー (".concat(e.status,'): "').concat(e.response,'"')},data_viewer_xhr_onerror:"ダウンロードエラー",save:"保存",record_server_url:"サーバーURLを記憶",record_secret_path:"転送パスを記憶",download_in_downloader:"ダウンロード"}},"3dfd":function(e,n,r){"use strict";r.d(n,"a",(function(){return x}));var t=function(){var e=this,n=e.$createElement,r=e._self._c||n;return r("v-app",{attrs:{id:"app"}},[r("v-app-bar",{ref:"app_bar",attrs:{app:""}},[r("v-toolbar-title",{staticStyle:{"margin-right":"0.6em"}},[r("v-tooltip",{attrs:{bottom:""},scopedSlots:e._u([{key:"activator",fn:function(n){var t=n.on;return[r("span",e._g({},t),[e._v(" Piping "),r("span",{staticClass:"font-weight-light"},[e._v("UI")])])]}}])},[r("span",[e._v(e._s(e.version))])])],1),e.pwa.updateExists?r("v-btn",{attrs:{depressed:"",color:"blue",dark:"",small:"",outlined:""},on:{click:e.refreshApp}},[r("v-icon",{attrs:{dark:"",left:""}},[e._v(e._s(e.icons.mdiCached))]),e._v(e._s(e.strings["pwa_update"])+" ")],1):e._e(),r("v-spacer"),r("v-menu",{attrs:{"close-on-content-click":!1},scopedSlots:e._u([{key:"activator",fn:function(n){var t=n.on;return[r("v-btn",e._g({attrs:{icon:""}},t),[r("v-icon",[e._v(e._s(e.icons.mdiDotsVertical))])],1)]}}])},[r("MenuContent",{model:{value:e.licenseDialog,callback:function(n){e.licenseDialog=n},expression:"licenseDialog"}})],1)],1),r("v-dialog",{attrs:{scrollable:"","max-width":"70%"},model:{value:e.licenseDialog,callback:function(n){e.licenseDialog=n},expression:"licenseDialog"}},[e.licenseDialog?r("Licenses",{model:{value:e.licenseDialog,callback:function(n){e.licenseDialog=n},expression:"licenseDialog"}}):e._e()],1),r("v-content",[r("PipingUI")],1)],1)},a=[],c=(r("d3b7"),r("d4ec")),o=r("bee2"),i=r("262e"),u=r("2caf"),s=r("9ab4"),d=r("60a3"),l=r("7dda"),f=r("f212"),p=r("7a2d"),h=r("1579"),g=r("94ed"),v=r("3f5a"),_=function(){return Promise.all([r.e("chunk-f311c04a"),r.e("chunk-61e68bee"),r.e("chunk-b9033c88")]).then(r.bind(null,"c28b"))},w=function(){return Promise.all([r.e("chunk-f311c04a"),r.e("chunk-61e68bee"),r.e("chunk-27989818")]).then(r.bind(null,"8f8f"))},b=function(){return Promise.all([r.e("chunk-f311c04a"),r.e("chunk-b3e37474")]).then(r.bind(null,"8b27"))},m=Object(l["makePromise"])(),k=m.promise,y=m.resolve,x=k,R=function(){var e=function(e){Object(i["a"])(r,e);var n=Object(u["a"])(r);function r(){var e;return Object(c["a"])(this,r),e=n.apply(this,arguments),e.licenseDialog=!1,e.icons={mdiCached:g["b"],mdiDotsVertical:g["j"]},e.pwa={refreshing:!1,registration:void 0,updateExists:!1},e.version=f["a"],e}return Object(o["a"])(r,[{key:"created",value:function(){document.addEventListener("swUpdated",this.showRefreshUI,{once:!0})}},{key:"beforeMount",value:function(){this.$vuetify.theme.dark=Object(v["a"])()}},{key:"mounted",value:function(){y(this.$refs["app_bar"].$el)}},{key:"showRefreshUI",value:function(e){this.pwa.registration=e.detail,this.pwa.updateExists=!0}},{key:"refreshApp",value:function(){var e=this;this.pwa.updateExists=!1,void 0!==this.pwa.registration&&this.pwa.registration.waiting&&(this.pwa.registration.waiting.postMessage({type:"skip-waiting"}),navigator.serviceWorker.addEventListener("controllerchange",(function(){e.pwa.refreshing||(e.pwa.refreshing=!0,window.location.reload())}),{once:!0}))}},{key:"strings",get:function(){return Object(h["a"])(p["a"].language)}}]),r}(d["d"]);return e=Object(s["a"])([Object(d["a"])({components:{PipingUI:_,MenuContent:w,Licenses:b}})],e),e}(),E=R,S=E,O=(r("034f"),r("2877")),P=r("6544"),j=r.n(P),T=r("7496"),A=r("40dc"),U=r("8336"),D=r("a75b"),C=r("169a"),L=r("132d"),H=r("e449"),V=r("2fa4"),B=r("2a7f"),N=r("3a2f"),M=Object(O["a"])(S,t,a,!1,null,null,null);n["b"]=M.exports;j()(M,{VApp:T["a"],VAppBar:A["a"],VBtn:U["a"],VContent:D["a"],VDialog:C["a"],VIcon:L["a"],VMenu:H["a"],VSpacer:V["a"],VToolbarTitle:B["a"],VTooltip:N["a"]})},"3f5a":function(e,n,r){"use strict";r.d(n,"a",(function(){return a}));var t=r("c106");function a(){var e=window.matchMedia("(prefers-color-scheme: dark)").matches,n=window.localStorage.getItem(t["a"].darkTheme);return null!==n&&(e="true"===n),e}},"7a2d":function(e,n,r){"use strict";r.d(n,"a",(function(){return o}));r("d3b7"),r("ac1f"),r("3ca3"),r("841c"),r("ddb0"),r("2b3d");var t=r("60a3"),a=r("c106"),c=r("85ee"),o=new t["d"]({data:{language:function(){var e,n,r,t;return null!==(e=null!==(n=null!==(r=null!==(t=new URLSearchParams(window.location.search).get(c["a"].langQueryParameterName))&&void 0!==t?t:window.localStorage.getItem(a["a"].language))&&void 0!==r?r:navigator.languages&&navigator.languages[0])&&void 0!==n?n:navigator.language)&&void 0!==e?e:navigator.userLanguage}(),recordsServerUrlHistory:!0,recordsSecretPathHistory:!0}})},"7dda":function(e,n,r){"use strict";r.r(n),r.d(n,"readableBytesString",(function(){return h})),r.d(n,"readBlobAsText",(function(){return g})),r.d(n,"baseAndExt",(function(){return v})),r.d(n,"zipFilesAsBlob",(function(){return _})),r.d(n,"isText",(function(){return m})),r.d(n,"sanitizeHtmlAllowingATag",(function(){return k})),r.d(n,"encrypt",(function(){return x})),r.d(n,"decrypt",(function(){return E})),r.d(n,"sha256",(function(){return O})),r.d(n,"makePromise",(function(){return j})),r.d(n,"sendToServiceWorker",(function(){return T}));r("99af"),r("a623"),r("caad"),r("ace4"),r("b0c0"),r("b680"),r("d3b7"),r("ac1f"),r("2532"),r("466d"),r("5cc6"),r("9a8c"),r("a975"),r("735e"),r("c1ac"),r("d139"),r("3a7b"),r("d5d6"),r("82f8"),r("e91f"),r("60bd"),r("5f96"),r("3280"),r("3fcc"),r("ca91"),r("25a1"),r("cd26"),r("3c5d"),r("2954"),r("649e"),r("219c"),r("170b"),r("b39a"),r("72f7");var t=r("2909"),a=r("3835"),c=r("b85c"),o=(r("96cf"),r("1da1")),i=(r("a4d3"),r("e01a"),Symbol("NOT_MEMORIZED"));function u(e){var n=i;return function(){return n===i&&(n=e()),n}}var s=regeneratorRuntime.mark(b),d=function(){return Promise.all([r.e("chunk-6e83591c"),r.e("chunk-2d217155")]).then(r.t.bind(null,"c4e3",7)).then((function(e){return e.default}))},l=function(){return r.e("chunk-2d0a429b").then(r.t.bind(null,"04ef",7)).then((function(e){return e.default}))},f=u(Object(o["a"])(regeneratorRuntime.mark((function e(){var n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,r.e("chunk-2d0c0332").then(r.t.bind(null,"4187",7));case 2:return n=e.sent,e.next=5,n.initWorker({path:"openpgp/openpgp.worker.min.js"});case 5:return e.abrupt("return",n);case 6:case"end":return e.stop()}}),e)})))),p=function(){return r.e("chunk-2d0c7b81").then(r.t.bind(null,"528f",7)).then((function(e){return e.default}))};function h(e,n){var r,t=["B","KB","MB","GB","TB","PB","EB","ZB","YB"],o=1,i=e,u=Object(c["a"])(t.entries());try{for(u.s();!(r=u.n()).done;){var s=Object(a["a"])(r.value,2),d=s[0],l=s[1];o*=1024;var f=e/o;if(f<1||d===t.length-1)return"".concat(i.toFixed(n)).concat(l);i=f}}catch(p){u.e(p)}finally{u.f()}return""}function g(e){return new Promise((function(n){var r=new FileReader;r.readAsText(e),r.onload=function(){n(r.result)}}))}function v(e){var n=e.match(/(.*)(\..*?)$/);return null===n?{baseName:"",ext:""}:{baseName:n[1],ext:n[2]}}function _(e){return w.apply(this,arguments)}function w(){return w=Object(o["a"])(regeneratorRuntime.mark((function e(n){var r,t,a,o,i,u;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,d();case 2:r=e.sent,t=r(),a=t.folder("files"),o=Object(c["a"])(n);try{for(u=function(){var e=i.value,n=function(){for(var n=e.name,r=v(e.name),t=r.baseName,c=r.ext,o=1;null!==a.file(n);o++)n="".concat(t,"__").concat(o).concat(c);return n}();a.file(n,e)},o.s();!(i=o.n()).done;)u()}catch(s){o.e(s)}finally{o.f()}return e.abrupt("return",a.generateAsync({type:"blob"}));case 8:case"end":return e.stop()}}),e)}))),w.apply(this,arguments)}function b(e,n){var r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:r=e;case 1:if(!(r<=n)){t.next=7;break}return t.next=4,r;case 4:r++,t.next=1;break;case 7:case"end":return t.stop()}}),s)}function m(e){var n=[7,8,9,10,12,13,27].concat(Object(t["a"])(b(32,255)));return e.every((function(e){return n.includes(e)}))}function k(e){return y.apply(this,arguments)}function y(){return y=Object(o["a"])(regeneratorRuntime.mark((function e(n){var r;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,l();case 2:return r=e.sent,e.abrupt("return",r(n,{allowedTags:["a"],allowedAttributes:{a:["href","target"]}}));case 4:case"end":return e.stop()}}),e)}))),y.apply(this,arguments)}function x(e,n){return R.apply(this,arguments)}function R(){return R=Object(o["a"])(regeneratorRuntime.mark((function e(n,r){var t,a,c;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,f();case 2:return t=e.sent,e.next=5,t.encrypt({message:t.message.fromBinary(n),passwords:[r],armor:!1});case 5:return a=e.sent,c=a.message.packets.write(),e.abrupt("return",c);case 8:case"end":return e.stop()}}),e)}))),R.apply(this,arguments)}function E(e,n){return S.apply(this,arguments)}function S(){return S=Object(o["a"])(regeneratorRuntime.mark((function e(n,r){var t,a;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,f();case 2:return t=e.sent,e.t0=t,e.next=6,t.message.read(n);case 6:return e.t1=e.sent,e.t2=[r],e.t3={message:e.t1,passwords:e.t2,format:"binary"},e.next=11,e.t0.decrypt.call(e.t0,e.t3);case 11:return a=e.sent.data,e.abrupt("return",a);case 13:case"end":return e.stop()}}),e)}))),S.apply(this,arguments)}function O(e){return P.apply(this,arguments)}function P(){return P=Object(o["a"])(regeneratorRuntime.mark((function e(n){var r,t;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,p();case 2:return r=e.sent,e.next=5,crypto.subtle.digest("SHA-256",(new TextEncoder).encode(n));case 5:return t=e.sent,e.abrupt("return",r(new Uint8Array(t)));case 7:case"end":return e.stop()}}),e)}))),P.apply(this,arguments)}function j(){var e=function(e){},n=function(){},r=new Promise((function(r,t){e=r,n=t}));return{promise:r,resolve:e,reject:n}}function T(e){return new Promise((function(n,r){if("serviceWorker"in navigator)if(null!==navigator.serviceWorker.controller){var t=new MessageChannel;t.port1.onmessage=n,navigator.serviceWorker.controller.postMessage(e,[t.port2])}else r(new Error("navigator.serviceWorker.controller is null"));else r(new Error("Service Worker not supported"))}))}},"85ee":function(e,n,r){"use strict";var t={langQueryParameterName:"lang"};n["a"]=t},"8a23":function(e,n,r){},c106:function(e,n,r){"use strict";r.d(n,"a",(function(){return t}));var t={darkTheme:"DARK_THEME",serverUrlHistory:"SERVER_URL_HISTORY",secretPathHistory:"SECRET_PATHS_HISTORY",language:"LANGUAGE",selectedServerUrl:"SELECTED_SERVER_URL",recordsServerUrlHistory:"RECORDS_SERVER_URL_HISTORY",recordsSecretPathHistory:"RECORDS_SECRET_PATH_HISTORY"}},cd49:function(e,n,r){"use strict";r.r(n);r("d3b7"),r("ac1f"),r("3ca3"),r("841c"),r("ddb0"),r("2b3d"),r("e260"),r("e6cf"),r("cca6"),r("a79d");var t=r("2b0e"),a=r("3dfd"),c=(r("96cf"),r("1da1")),o=r("9483"),i=function(){return r.e("chunk-2d2100ac").then(r.bind(null,"b5cf"))};Object(o["a"])("".concat("","service-worker.js"),{ready:function(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered:function(){return Object(c["a"])(regeneratorRuntime.mark((function e(){var n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return console.log("Service worker has been registered."),e.next=3,i();case 3:return n=e.sent,e.t0=console,e.next=7,n.supportsSwDownload;case 7:e.t1=e.sent,e.t0.log.call(e.t0,"Support streaming download:",e.t1);case 9:case"end":return e.stop()}}),e)})))()},cached:function(){console.log("Content has been cached for offline use.")},updatefound:function(){console.log("New content is downloading.")},updated:function(e){console.log("New content is available; please refresh."),document.dispatchEvent(new CustomEvent("swUpdated",{detail:e}))},offline:function(){console.log("No internet connection found. App is running in offline mode.")},error:function(e){console.error("Error during service worker registration:",e)}});var u=r("f309");t["default"].use(u["a"]);var s=new u["a"]({icons:{iconfont:"mdiSvg"}}),d=r("3003"),l=r("d9a0"),f=r("85ee"),p=r("ecee"),h=r("f2d1"),g=r("ad3d");(function(){var e=new URLSearchParams(window.location.search).get(f["a"].langQueryParameterName);if(null!==e){var n=document.getElementsByTagName("html");n.item(0).lang=e;var r=document.querySelector('meta[name="description"]');r.content=function(){switch(e){case"en":case"ja":return l[e];default:return""}}()}})(),r.e("chunk-2d0d75dd").then(r.t.bind(null,"7707",7)).then((function(e){return e.polyfill()})),p["c"].add(h["a"]),t["default"].component("font-awesome-icon",g["a"]),t["default"].config.productionTip=!1,t["default"].use(d["a"]),new t["default"]({vuetify:s,render:function(e){return e(a["b"])}}).$mount("#app")},d9a0:function(e){e.exports=JSON.parse('{"en":"Easy and secure file transfer between every device over HTTPS with/without E2E encryption by ECDH and OpenPGP","ja":"Piping UIは手軽にセキュアにあらゆるデバイス間でファイルやテキストをECDH/OpenPGPを用いて暗号化して転送します。"}')},f212:function(e,n,r){"use strict";r.d(n,"a",(function(){return t}));var t="0.6.18"}});
//# sourceMappingURL=app.10fd6f05.js.map