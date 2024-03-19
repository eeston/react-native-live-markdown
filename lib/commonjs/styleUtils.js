"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeMarkdownStyleWithDefault = mergeMarkdownStyleWithDefault;
var _reactNative = require("react-native");
const FONT_FAMILY_MONOSPACE = _reactNative.Platform.select({
  ios: 'Courier',
  default: 'monospace'
});
function makeDefaultMarkdownStyle() {
  return {
    syntax: {
      color: 'gray'
    },
    link: {
      color: 'blue'
    },
    h1: {
      fontSize: 25
    },
    blockquote: {
      borderColor: 'gray',
      borderWidth: 6,
      marginLeft: 6,
      paddingLeft: 6
    },
    code: {
      fontFamily: FONT_FAMILY_MONOSPACE,
      color: 'black',
      backgroundColor: 'lightgray'
    },
    pre: {
      fontFamily: FONT_FAMILY_MONOSPACE,
      color: 'black',
      backgroundColor: 'lightgray'
    },
    mentionHere: {
      color: 'green',
      backgroundColor: 'lime'
    },
    mentionUser: {
      color: 'blue',
      backgroundColor: 'cyan'
    }
  };
}
function mergeMarkdownStyleWithDefault(input) {
  const output = makeDefaultMarkdownStyle();
  if (input !== undefined) {
    Object.keys(input).forEach(key => {
      if (!(key in output)) {
        return;
      }
      Object.assign(output[key], input[key]);
    });
  }
  return output;
}
//# sourceMappingURL=styleUtils.js.map