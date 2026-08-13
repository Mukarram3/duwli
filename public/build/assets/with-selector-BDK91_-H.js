import{a3 as R}from"./ui-CUd_MbMF.js";import{s as j}from"./index-awwmWbDJ.js";var w={exports:{}},E={};/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var c=R,z=j;function M(r,u){return r===u&&(r!==0||1/r===1/u)||r!==r&&u!==u}var p=typeof Object.is=="function"?Object.is:M,y=z.useSyncExternalStore,D=c.useRef,O=c.useEffect,h=c.useMemo,G=c.useDebugValue;E.useSyncExternalStoreWithSelector=function(r,u,m,s,a){var o=D(null);if(o.current===null){var f={hasValue:!1,value:null};o.current=f}else f=o.current;o=h(function(){function n(e){if(!d){if(d=!0,l=e,e=s(e),a!==void 0&&f.hasValue){var t=f.value;if(a(t,e))return v=t}return v=e}if(t=v,p(l,e))return t;var V=s(e);return a!==void 0&&a(t,V)?(l=e,t):(l=e,v=V)}var d=!1,l,v,b=m===void 0?null:m;return[function(){return n(u())},b===null?void 0:function(){return n(b())}]},[u,m,s,a]);var i=y(r,o[0],o[1]);return O(function(){f.hasValue=!0,f.value=i},[i]),G(i),i};w.exports=E;var _=w.exports;export{_ as w};
