(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-2d0ab41b"],{1501:function(e,t,n){var i,o,s;
/*!
 * vue-filepond v6.0.3
 * A handy FilePond adapter component for Vue
 * 
 * Copyright (c) 2020 PQINA
 * https://pqina.nl/filepond
 * 
 * Licensed under the MIT license.
 */(function(r,c){o=[t,n("2b0e"),n("c062")],i=c,s="function"===typeof i?i.apply(t,o):i,void 0===s||(e.exports=s)})("undefined"!==typeof globalThis?globalThis:"undefined"!==typeof self&&self,(function(e,t,n){"use strict";function i(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(e,"__esModule",{value:!0}),e.default=e.setOptions=void 0,t=i(t);var o=["setOptions","on","off","onOnce","appendTo","insertAfter","insertBefore","isAttachedTo","replaceElement","restoreElement","destroy"],s=(0,n.supported)(),r=function(e){return{string:String,boolean:Boolean,array:Array,function:Function,int:Number,serverapi:Object,object:Object}[e]},c={},a=[],u={},p=[],d={},l=function(e){d=Object.assign(d,e),p.forEach((function(e){e.setOptions(d)}))};e.setOptions=l;var f=function(){n.registerPlugin.apply(void 0,arguments),a.length=0;var e=function(e){if(/^on/.test(e))return a.push(e),"continue";c[e]=[String,r(n.OptionTypes[e])],u[e]=function(t){this._pond[e]=t}};for(var i in n.OptionTypes)e(i);return t.default.component("FilePond",{name:"FilePond",props:c,watch:u,render:function(e){return e("div",{class:{"filepond--wrapper":!0}},[e("input",{attrs:{id:this.id,name:this.name,type:"file",class:this.className,required:this.required,multiple:this.allowMultiple,accept:this.acceptedFileTypes,capture:this.captureMethod}})])},mounted:function(){var e=this;if(s){this._element=this.$el.querySelector("input");var t=a.reduce((function(t,n){return t[n]=function(){e.$emit("input",e._pond?e._pond.getFiles():[]);for(var t=arguments.length,i=new Array(t),o=0;o<t;o++)i[o]=arguments[o];e.$emit.apply(e,[n.substr(2)].concat(i))},t}),{}),i=Object.assign({},this.$attrs);this._pond=(0,n.create)(this._element,Object.assign({},d,t,i,this.$options.propsData)),Object.keys(this._pond).filter((function(e){return!o.includes(e)})).forEach((function(t){e[t]=e._pond[t]})),p.push(this._pond)}},destroyed:function(){var e=this,t=this.$options.detached;if(this.$el.offsetParent){var n=function(n,i){var o=(n[0]||{}).removedNodes||[],s=o[0];s&&s.contains(e.$el)&&(i.disconnect(),t.call(e))},i=new MutationObserver(n);i.observe(document.documentElement,{childList:!0,subtree:!0})}else t.call(this)},detached:function(){if(this._pond){this._pond.destroy();var e=p.indexOf(this._pond);e>=0&&p.splice(e,1),this._pond=null}}})};e.default=f}))}}]);
//# sourceMappingURL=chunk-2d0ab41b.256ed38f.js.map