(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-c93e2486"],{"0ba7":function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r("8d19");function s(e){return n.blobToArrayBuffer(e).then((function(e){return new Uint8Array(e)}))}t.blobToUint8Array=s,t.default=s},7600:function(e,t,r){"use strict";function n(e){var t=[].map.call(e,(function(e){return e.charCodeAt(0)}));return new Uint8Array(t)}Object.defineProperty(t,"__esModule",{value:!0}),t.stringToUint8Array=n,t.default=n},"8d19":function(e,t,r){"use strict";function n(e){return new Promise((function(t,r){var n=new FileReader;n.onload=function(){var e=n.result;t(e)},n.onerror=r,n.readAsArrayBuffer(e)}))}Object.defineProperty(t,"__esModule",{value:!0}),t.blobToArrayBuffer=n,t.default=n},e3be:function(e,t,r){"use strict";r.r(t);var n=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("v-expansion-panel",{attrs:{active:"true"}},[r("v-expansion-panel-header",{attrs:{"disable-icon-rotate":e.isDoneUpload||e.hasError},scopedSlots:e._u([{key:"actions",fn:function(){return[r("v-icon",{staticStyle:{"margin-left":"0.3em"},attrs:{color:e.headerIconColor}},[e._v(" "+e._s(e.headerIcon)+" ")])]},proxy:!0}])},[r("span",[e._v(e._s(e.strings["upload"])+" #"+e._s(e.props.uploadNo))]),e._v(" "+e._s(e.isReadyToUpload?e.progressPercentage&&e.progressPercentage.toFixed(2)+" %":"")+" ")]),r("v-expansion-panel-content",["passwordless"===e.props.protection.type&&"initial"===e.verificationStep.type?r("v-alert",{attrs:{type:"info"}},[r("span",{},[e._v(e._s(e.strings["waiting_for_receiver"]))])]):e._e(),"passwordless"===e.props.protection.type&&"verification_code_arrived"===e.verificationStep.type?r("span",[r("VerificationCode",{attrs:{value:e.verificationStep.verificationCode}}),r("v-layout",[r("v-flex",{attrs:{xs6:""}},[r("v-btn",{attrs:{color:"success",block:""},on:{click:function(t){return e.verify(!0)}}},[r("v-icon",{attrs:{left:"",dark:""}},[e._v(e._s(e.icons.mdiCheck))]),e._v(" "+e._s(e.strings["verify_and_send"])+" ")],1)],1),r("v-flex",{attrs:{xs6:""}},[r("v-btn",{attrs:{color:"error",block:""},on:{click:function(t){return e.verify(!1)}}},[r("v-icon",{attrs:{left:"",dark:""}},[e._v(e._s(e.icons.mdiCancel))]),e._v(" "+e._s(e.strings["cancel"])+" ")],1)],1)],1)],1):e._e(),r("div",{directives:[{name:"show",rawName:"v-show",value:e.isCompressing,expression:"isCompressing"}]},[r("div",{staticStyle:{"text-align":"center"}},[e._v(" "+e._s(e.strings["compressing"])+" ")]),r("v-progress-linear",{attrs:{indeterminate:""}})],1),r("div",{directives:[{name:"show",rawName:"v-show",value:e.isEncrypting,expression:"isEncrypting"}]},[r("div",{staticStyle:{"text-align":"center"}},[e._v(" "+e._s(e.strings["encrypting"])+" ")]),r("v-progress-linear",{attrs:{indeterminate:""}})],1),r("div",{directives:[{name:"show",rawName:"v-show",value:e.isReadyToUpload,expression:"isReadyToUpload"}]},[r("v-tooltip",{attrs:{bottom:""},scopedSlots:e._u([{key:"activator",fn:function(t){var n=t.on;return[r("div",e._g({staticStyle:{"text-align":"center"}},n),[e._v(" "+e._s(e.readableBytesString(e.progressSetting.loadedBytes,1))+" of "+e._s(e.readableBytesString(e.progressSetting.totalBytes,1))+" ")])]}}])},[r("span",[e._v(e._s(e.progressSetting.loadedBytes)+" of "+e._s(e.progressSetting.totalBytes))])]),r("v-progress-linear",{attrs:{value:e.progressPercentage}})],1),r("v-simple-table",{staticClass:"text-left"},[r("tbody",[r("tr",{staticClass:"text-left"},[r("td",[e._v(e._s(e.strings["upload_url"]))]),r("td",[e._v(e._s(e.uploadPath))])])])]),e.isCancelable?r("div",{staticStyle:{"text-align":"right"}},[r("v-btn",{staticClass:"ma-2 justify-end",attrs:{color:"warning",outlined:""},on:{click:function(t){return e.cancelUpload()}}},[r("v-icon",[e._v(e._s(e.icons.mdiCloseCircle))]),e._v(" "+e._s(e.strings["cancel"])+" ")],1)],1):e._e(),r("v-alert",{attrs:{type:"error",outlined:"",value:e.hasError},domProps:{innerHTML:e._s(e.errorMessage)}})],1)],1)},s=[],a=(r("d3b7"),r("96cf"),r("1da1")),i=r("d4ec"),o=r("bee2"),c=r("262e"),u=r("2caf"),p=r("9ab4"),l=r("60a3"),d=r("4ff6"),h=r.n(d),f=r("0ba7"),g=r("7600"),v=r("7dda"),y=r("5e5c"),b=r("7a2d"),x=r("1579"),_=r("94ed"),m=r("ff72"),w=r("b77c"),k=r.e("piping-ui-auth").then(r.bind(null,"9134")),S=function(){var e=function(e){Object(c["a"])(r,e);var t=Object(u["a"])(r);function r(){var e;return Object(i["a"])(this,r),e=t.call(this),e.progressSetting={loadedBytes:0,totalBytes:void 0},e.readableBytesString=v["readableBytesString"],e.errorMessageDelegate=function(){return""},e.canceled=!1,e.isCompressing=!1,e.isEncrypting=!1,e.verificationStep={type:"initial"},e.icons={mdiCloseCircle:_["g"],mdiCheck:_["d"],mdiCancel:_["c"]},e.xhr=new XMLHttpRequest,e}return Object(o["a"])(r,[{key:"errorMessage",value:function(){var e=Object(a["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.abrupt("return",this.errorMessageDelegate());case 1:case"end":return e.stop()}}),e,this)})));function t(){return e.apply(this,arguments)}return t}()},{key:"hasError",value:function(){var e=Object(a["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return e.next=2,this.errorMessageDelegate();case 2:return e.t0=e.sent,e.abrupt("return",""!==e.t0);case 4:case"end":return e.stop()}}),e,this)})));function t(){return e.apply(this,arguments)}return t}()},{key:"mounted",value:function(){var e=Object(a["a"])(regeneratorRuntime.mark((function e(){var t,r,n,s=this;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:y["b"](this.$el),e.t0=this.props.protection.type,e.next="raw"===e.t0?4:"password"===e.t0?7:"passwordless"===e.t0?10:22;break;case 4:return e.next=6,this.send(void 0);case 6:return e.abrupt("break",22);case 7:return e.next=9,this.send(this.props.protection.password);case 9:return e.abrupt("break",22);case 10:return e.next=12,k;case 12:return e.next=14,e.sent.keyExchange(this.props.serverUrl,"sender",this.props.secretPath);case 14:if(t=e.sent,"error"!==t.type){e.next=19;break}return this.verificationStep={type:"error"},this.errorMessageDelegate=function(){return s.strings["key_exchange_error"](t.errorCode)},e.abrupt("return");case 19:return r=t.key,n=t.verificationCode,this.verificationStep={type:"verification_code_arrived",verificationCode:n,key:r},e.abrupt("break",22);case 22:case"end":return e.stop()}}),e,this)})));function t(){return e.apply(this,arguments)}return t}()},{key:"verify",value:function(){var e=Object(a["a"])(regeneratorRuntime.mark((function e(t){var r,n,s,a;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:if("verification_code_arrived"===this.verificationStep.type){e.next=2;break}throw new Error("Unexpected state: this.verificationStep.type should be 'verification_code_arrived'");case 2:return r=this.verificationStep.key,this.verificationStep={type:"verified",verified:t},n={verified:t},e.next=7,v["encrypt"](Object(g["stringToUint8Array"])(JSON.stringify(n)),r);case 7:return s=e.sent,e.t0=h.a,e.t1=this.props.serverUrl,e.next=12,k;case 12:return e.next=14,e.sent.verifiedPath(this.props.secretPath);case 14:return e.t2=e.sent,a=(0,e.t0)(e.t1,e.t2),e.next=18,fetch(a,{method:"POST",body:s});case 18:if(!t){e.next=21;break}return e.next=21,this.send(r);case 21:case"end":return e.stop()}}),e,this)})));function t(t){return e.apply(this,arguments)}return t}()},{key:"send",value:function(){var e=Object(a["a"])(regeneratorRuntime.mark((function e(t){var r,n,s,i,o,c=this;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:return r=this.props.data,e.next=3,Object(a["a"])(regeneratorRuntime.mark((function e(){var t,n;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:if("string"!==typeof r){e.next=4;break}return e.abrupt("return",new Blob([r]));case 4:if(1!==r.length){e.next=8;break}return e.abrupt("return",r[0]);case 8:return t=r,c.isCompressing=!0,e.next=12,v["zipFilesAsBlob"](t);case 12:return n=e.sent,c.isCompressing=!1,e.abrupt("return",n);case 15:case"end":return e.stop()}}),e)})))();case 3:return n=e.sent,e.next=6,Object(a["a"])(regeneratorRuntime.mark((function e(){var r,s;return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:if(void 0!==t){e.next=4;break}return e.abrupt("return",{body:n,bodyLength:n.size});case 4:return c.isEncrypting=!0,e.next=7,Object(f["blobToUint8Array"])(n);case 7:return r=e.sent,e.next=10,v["encrypt"](r,t);case 10:return s=e.sent,c.isEncrypting=!1,e.abrupt("return",{body:s,bodyLength:s.byteLength});case 13:case"end":return e.stop()}}),e)})))();case 6:s=e.sent,i=s.body,o=s.bodyLength,this.xhr.open("POST",this.uploadPath,!0),this.xhr.responseType="text",this.xhr.upload.onprogress=function(e){c.progressSetting.loadedBytes=e.loaded,c.progressSetting.totalBytes=e.total},this.xhr.upload.onload=function(){200===c.xhr.status&&void 0!==c.progressSetting.totalBytes&&(c.progressSetting.loadedBytes=c.progressSetting.totalBytes)},this.xhr.onload=function(){200!==c.xhr.status&&(c.errorMessageDelegate=function(){return c.strings["xhr_status_error"]({status:c.xhr.status,response:c.xhr.responseText})})},this.xhr.onerror=function(e){c.errorMessageDelegate=function(){return c.strings["data_uploader_xhr_onerror"]({serverUrl:c.props.serverUrl})}},this.xhr.upload.onerror=function(){c.errorMessageDelegate=function(){return c.strings["data_uploader_xhr_upload_onerror"]}},this.xhr.send(i),this.progressSetting.loadedBytes=0,this.progressSetting.totalBytes=o;case 19:case"end":return e.stop()}}),e,this)})));function t(t){return e.apply(this,arguments)}return t}()},{key:"cancelUpload",value:function(){this.xhr.abort(),this.canceled=!0}},{key:"progressPercentage",get:function(){return void 0===this.progressSetting.totalBytes?null:0===this.progressSetting.totalBytes?100:this.progressSetting.loadedBytes/this.progressSetting.totalBytes*100}},{key:"isDoneUpload",get:function(){return 100===this.progressPercentage}},{key:"uploadPath",get:function(){return h()(this.props.serverUrl,this.props.secretPath)}},{key:"headerIcon",get:function(){var e=this;return e.hasError?_["a"]:this.canceled?_["g"]:this.isDoneUpload?_["d"]:_["e"]}},{key:"headerIconColor",get:function(){var e=this;return e.hasError?"error":this.canceled?"warning":this.isDoneUpload?"teal":void 0}},{key:"isCancelable",get:function(){return this.isReadyToUpload&&!this.isDoneUpload&&!this.hasError&&!this.canceled}},{key:"isReadyToUpload",get:function(){var e=!this.isCompressing&&!this.isEncrypting;return"passwordless"===this.props.protection.type?"verified"===this.verificationStep.type&&this.verificationStep.verified&&e:e}},{key:"strings",get:function(){return Object(x["a"])(b["a"].language)}}]),r}(l["d"]);return Object(p["a"])([Object(l["c"])()],e.prototype,"props",void 0),Object(p["a"])([Object(m["a"])()],e.prototype,"errorMessage",null),Object(p["a"])([Object(m["a"])()],e.prototype,"hasError",null),e=Object(p["a"])([Object(l["a"])({components:{VerificationCode:w["a"]}})],e),e}(),C=S,O=C,j=r("2877"),B=r("6544"),U=r.n(B),P=r("0798"),R=r("8336"),E=r("cd55"),T=r("49e2"),M=r("c865"),A=r("0e8f"),V=r("132d"),D=r("a722"),L=r("8e36"),I=r("1f4f"),N=r("3a2f"),F=Object(j["a"])(O,n,s,!1,null,"0b95b406",null);t["default"]=F.exports;U()(F,{VAlert:P["a"],VBtn:R["a"],VExpansionPanel:E["a"],VExpansionPanelContent:T["a"],VExpansionPanelHeader:M["a"],VFlex:A["a"],VIcon:V["a"],VLayout:D["a"],VProgressLinear:L["a"],VSimpleTable:I["a"],VTooltip:N["a"]})},ff72:function(e,t,r){"use strict";r.d(t,"a",(function(){return s}));var n=r("2fe1");function s(e){return Object(n["a"])((t,r)=>{t.asyncComputed=t.asyncComputed||{};const n=t.methods[r];t.asyncComputed[r]=Object.assign({get:n},e),delete t.methods[r]})}}}]);
//# sourceMappingURL=chunk-c93e2486.bf68759b.js.map