"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _react = _interopRequireDefault(require("react"));
var _MarkdownTextInputDecoratorViewNativeComponent = _interopRequireDefault(require("./MarkdownTextInputDecoratorViewNativeComponent"));
var _NativeLiveMarkdownModule = _interopRequireDefault(require("./NativeLiveMarkdownModule"));
var StyleUtils = _interopRequireWildcard(require("./styleUtils"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
if (_NativeLiveMarkdownModule.default) {
  _NativeLiveMarkdownModule.default.install();
}
function processColorsInMarkdownStyle(input) {
  const output = JSON.parse(JSON.stringify(input));
  Object.keys(output).forEach(key => {
    const obj = output[key];
    Object.keys(obj).forEach(prop => {
      // TODO: use ReactNativeStyleAttributes from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes'
      if (!(prop === 'color' || prop.endsWith('Color'))) {
        return;
      }
      obj[prop] = (0, _reactNative.processColor)(obj[prop]);
    });
  });
  return output;
}
function processMarkdownStyle(input) {
  return processColorsInMarkdownStyle(StyleUtils.mergeMarkdownStyleWithDefault(input));
}
const MarkdownTextInput = /*#__PURE__*/_react.default.forwardRef((props, ref) => {
  const IS_FABRIC = ('nativeFabricUIManager' in global);
  const markdownStyle = _react.default.useMemo(() => processMarkdownStyle(props.markdownStyle), [props.markdownStyle]);
  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_reactNative.TextInput, _extends({}, props, {
    ref: ref
  })), /*#__PURE__*/_react.default.createElement(_MarkdownTextInputDecoratorViewNativeComponent.default, {
    style: IS_FABRIC ? styles.farAway : styles.displayNone,
    markdownStyle: markdownStyle
  }));
});
const styles = _reactNative.StyleSheet.create({
  displayNone: {
    display: 'none'
  },
  farAway: {
    position: 'absolute',
    top: 1e8,
    left: 1e8
  }
});
var _default = exports.default = MarkdownTextInput;
//# sourceMappingURL=MarkdownTextInput.js.map