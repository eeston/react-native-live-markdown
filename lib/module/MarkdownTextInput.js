function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import { StyleSheet, TextInput, processColor } from 'react-native';
import React from 'react';
import MarkdownTextInputDecoratorViewNativeComponent from './MarkdownTextInputDecoratorViewNativeComponent';
import NativeLiveMarkdownModule from './NativeLiveMarkdownModule';
import * as StyleUtils from './styleUtils';
if (NativeLiveMarkdownModule) {
  NativeLiveMarkdownModule.install();
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
      obj[prop] = processColor(obj[prop]);
    });
  });
  return output;
}
function processMarkdownStyle(input) {
  return processColorsInMarkdownStyle(StyleUtils.mergeMarkdownStyleWithDefault(input));
}
const MarkdownTextInput = /*#__PURE__*/React.forwardRef((props, ref) => {
  const IS_FABRIC = ('nativeFabricUIManager' in global);
  const markdownStyle = React.useMemo(() => processMarkdownStyle(props.markdownStyle), [props.markdownStyle]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TextInput, _extends({}, props, {
    ref: ref
  })), /*#__PURE__*/React.createElement(MarkdownTextInputDecoratorViewNativeComponent, {
    style: IS_FABRIC ? styles.farAway : styles.displayNone,
    markdownStyle: markdownStyle
  }));
});
const styles = StyleSheet.create({
  displayNone: {
    display: 'none'
  },
  farAway: {
    position: 'absolute',
    top: 1e8,
    left: 1e8
  }
});
export default MarkdownTextInput;
//# sourceMappingURL=MarkdownTextInput.js.map