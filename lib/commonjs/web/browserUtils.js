"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isFirefox = exports.isChromium = void 0;
const isFirefox = exports.isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const isChromium = exports.isChromium = 'chrome' in window;
//# sourceMappingURL=browserUtils.js.map