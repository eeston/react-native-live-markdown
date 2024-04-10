"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var ParseUtils = _interopRequireWildcard(require("./web/parserUtils"));
var CursorUtils = _interopRequireWildcard(require("./web/cursorUtils"));
var StyleUtils = _interopRequireWildcard(require("./styleUtils"));
require("./web/MarkdownTextInput.css");
var _InputHistory = _interopRequireDefault(require("./web/InputHistory"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable @typescript-eslint/no-explicit-any */

require('../parser/react-native-live-markdown-parser.js');
const useClientEffect = typeof window === 'undefined' ? _react.useEffect : _react.useLayoutEffect;
let createReactDOMStyle;
try {
  createReactDOMStyle =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-web/dist/exports/StyleSheet/compiler/createReactDOMStyle').default;
} catch (e) {
  throw new Error('[react-native-live-markdown] Function `createReactDOMStyle` from react-native-web not found. Please make sure that you are using React Native Web 0.18 or newer.');
}
let preprocessStyle;
try {
  preprocessStyle =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-web/dist/exports/StyleSheet/preprocess').default;
} catch (e) {
  throw new Error('[react-native-live-markdown] Function `preprocessStyle` from react-native-web not found.');
}
let dangerousStyleValue;
try {
  dangerousStyleValue =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-web/dist/modules/setValueForStyles/dangerousStyleValue').default;
} catch (e) {
  throw new Error('[react-native-live-markdown] Function `dangerousStyleValue` from react-native-web not found.');
}
let focusTimeout = null;

// Removes one '\n' from the end of the string that were added by contentEditable div
function normalizeValue(value) {
  return value.replace(/\n$/, '');
}

// If an Input Method Editor is processing key input, the 'keyCode' is 229.
// https://www.w3.org/TR/uievents/#determine-keydown-keyup-keyCode
function isEventComposing(nativeEvent) {
  return nativeEvent.isComposing || nativeEvent.keyCode === 229;
}
const ZERO_WIDTH_SPACE = '\u200B';
function getPlaceholderValue(placeholder) {
  if (!placeholder) {
    return ZERO_WIDTH_SPACE;
  }
  return placeholder.length ? placeholder : ZERO_WIDTH_SPACE;
}
function processUnitsInMarkdownStyle(input) {
  const output = JSON.parse(JSON.stringify(input));
  Object.keys(output).forEach(key => {
    const obj = output[key];
    Object.keys(obj).forEach(prop => {
      obj[prop] = dangerousStyleValue(prop, obj[prop], false);
    });
  });
  return output;
}
function processMarkdownStyle(input) {
  return processUnitsInMarkdownStyle(StyleUtils.mergeMarkdownStyleWithDefault(input));
}
function getElementHeight(node, styles, numberOfLines) {
  if (numberOfLines) {
    const tempElement = document.createElement('div');
    tempElement.setAttribute('contenteditable', 'true');
    Object.assign(tempElement.style, styles);
    tempElement.innerText = Array(numberOfLines).fill('A').join('\n');
    if (node.parentElement) {
      node.parentElement.appendChild(tempElement);
      const height = tempElement.clientHeight;
      node.parentElement.removeChild(tempElement);
      return `${height}px`;
    }
  }
  return `${styles.height}px` || 'auto';
}
const MarkdownTextInput = /*#__PURE__*/_react.default.forwardRef(({
  accessibilityLabel,
  accessibilityLabelledBy,
  accessibilityRole,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  blurOnSubmit = false,
  clearTextOnFocus,
  dir = 'auto',
  disabled = false,
  numberOfLines,
  multiline = false,
  markdownStyle,
  onBlur,
  onChange,
  onChangeText,
  onClick,
  onFocus,
  onKeyPress,
  onSelectionChange,
  onSubmitEditing,
  placeholder,
  placeholderTextColor = `rgba(0,0,0,0.2)`,
  selectTextOnFocus,
  spellCheck,
  selection,
  style = {},
  value,
  autoFocus = false
}, ref) => {
  const compositionRef = (0, _react.useRef)(false);
  const pasteRef = (0, _react.useRef)(false);
  const divRef = (0, _react.useRef)(null);
  const currentlyFocusedField = (0, _react.useRef)(null);
  const contentSelection = (0, _react.useRef)(null);
  const className = `react-native-live-markdown-input-${multiline ? 'multiline' : 'singleline'}`;
  const history = (0, _react.useRef)();
  if (!history.current) {
    history.current = new _InputHistory.default(100);
  }
  const flattenedStyle = (0, _react.useMemo)(() => _reactNative.StyleSheet.flatten(style), [style]);

  // Empty placeholder would collapse the div, so we need to use zero-width space to prevent it
  const heightSafePlaceholder = (0, _react.useMemo)(() => getPlaceholderValue(placeholder), [placeholder]);
  const setEventProps = (0, _react.useCallback)(e => {
    if (divRef.current) {
      const text = normalizeValue(divRef.current.innerText || '');
      if (e.target) {
        // TODO: change the logic here so every event have value property
        e.target.value = text;
      }
      if (e.nativeEvent && e.nativeEvent.text) {
        e.nativeEvent.text = text;
      }
    }
    return e;
  }, []);
  const parseText = (0, _react.useCallback)((target, text, customMarkdownStyles, cursorPosition = null, shouldAddToHistory = true) => {
    if (text === null) {
      return {
        text: target.innerText,
        cursorPosition: null
      };
    }
    const parsedText = ParseUtils.parseText(target, text, cursorPosition, customMarkdownStyles, !multiline);
    if (history.current && shouldAddToHistory) {
      history.current.debouncedAdd(parsedText.text, parsedText.cursorPosition);
    }
    return parsedText;
  }, [multiline]);
  const processedMarkdownStyle = (0, _react.useMemo)(() => {
    const newMarkdownStyle = processMarkdownStyle(markdownStyle);
    if (divRef.current) {
      parseText(divRef.current, divRef.current.innerText, newMarkdownStyle);
    }
    return newMarkdownStyle;
  }, [markdownStyle, parseText]);
  const inputStyles = (0, _react.useMemo)(() => _reactNative.StyleSheet.flatten([styles.defaultInputStyles, flattenedStyle && {
    caretColor: flattenedStyle.color || 'black'
  }, disabled && styles.disabledInputStyles, createReactDOMStyle(preprocessStyle(flattenedStyle))]), [flattenedStyle, disabled]);
  const undo = (0, _react.useCallback)(target => {
    if (!history.current) return '';
    const item = history.current.undo();
    return parseText(target, item ? item.text : null, processedMarkdownStyle, item ? item.cursorPosition : null, false).text;
  }, [parseText, processedMarkdownStyle]);
  const redo = (0, _react.useCallback)(target => {
    if (!history.current) return '';
    const item = history.current.redo();
    return parseText(target, item ? item.text : null, processedMarkdownStyle, item ? item.cursorPosition : null, false).text;
  }, [parseText, processedMarkdownStyle]);

  // We have to process value property since contentEditable div adds one additional '\n' at the end of the text if we are entering new line
  const processedValue = (0, _react.useMemo)(() => {
    if (value && value[value.length - 1] === '\n') {
      return `${value}\n`;
    }
    return value;
  }, [value]);

  // Placeholder text color logic
  const updateTextColor = (0, _react.useCallback)((node, text) => {
    // eslint-disable-next-line no-param-reassign -- we need to change the style of the node, so we need to modify it
    node.style.color = String(placeholder && (text === '' || text === '\n') ? placeholderTextColor : flattenedStyle.color || 'black');
  }, [flattenedStyle.color, placeholder, placeholderTextColor]);
  const handleSelectionChange = (0, _react.useCallback)(event => {
    const e = event;
    setEventProps(e);
    if (onSelectionChange && contentSelection.current) {
      e.nativeEvent.selection = contentSelection.current;
      onSelectionChange(e);
    }
  }, [onSelectionChange, setEventProps]);
  const updateRefSelectionVariables = (0, _react.useCallback)(newSelection => {
    const {
      start,
      end
    } = newSelection;
    const markdownHTMLInput = divRef.current;
    markdownHTMLInput.selectionStart = start;
    markdownHTMLInput.selectionEnd = end;
  }, []);
  const updateSelection = (0, _react.useCallback)((e = null, predefinedSelection = null) => {
    if (!divRef.current) {
      return;
    }
    const newSelection = predefinedSelection || CursorUtils.getCurrentCursorPosition(divRef.current);
    if (newSelection && (!contentSelection.current || contentSelection.current.start !== newSelection.start || contentSelection.current.end !== newSelection.end)) {
      updateRefSelectionVariables(newSelection);
      contentSelection.current = newSelection;
      if (e) {
        handleSelectionChange(e);
      }
    }
  }, [handleSelectionChange, updateRefSelectionVariables]);
  const handleOnChangeText = (0, _react.useCallback)(e => {
    if (!divRef.current || !(e.target instanceof HTMLElement)) {
      return;
    }
    if (compositionRef.current) {
      updateTextColor(divRef.current, e.target.innerText);
      compositionRef.current = false;
      return;
    }
    let text = '';
    const nativeEvent = e.nativeEvent;
    switch (nativeEvent.inputType) {
      case 'historyUndo':
        text = undo(divRef.current);
        break;
      case 'historyRedo':
        text = redo(divRef.current);
        break;
      default:
        text = parseText(divRef.current, e.target.innerText, processedMarkdownStyle).text;
    }
    if (pasteRef !== null && pasteRef !== void 0 && pasteRef.current) {
      pasteRef.current = false;
      updateSelection(e);
    }
    updateTextColor(divRef.current, e.target.innerText);
    if (onChange) {
      const event = e;
      setEventProps(event);
      onChange(event);
    }
    if (onChangeText) {
      const normalizedText = normalizeValue(text);
      onChangeText(normalizedText);
    }
  }, [updateSelection, updateTextColor, onChange, onChangeText, undo, redo, parseText, processedMarkdownStyle, setEventProps]);
  const handleKeyPress = (0, _react.useCallback)(e => {
    if (!divRef.current) {
      return;
    }
    const hostNode = e.target;
    e.stopPropagation();
    if (e.key === 'z' && e.metaKey) {
      e.preventDefault();
      const nativeEvent = e.nativeEvent;
      if (e.shiftKey) {
        nativeEvent.inputType = 'historyRedo';
      } else {
        nativeEvent.inputType = 'historyUndo';
      }
      handleOnChangeText(e);
      return;
    }
    const blurOnSubmitDefault = !multiline;
    const shouldBlurOnSubmit = blurOnSubmit === null ? blurOnSubmitDefault : blurOnSubmit;
    const nativeEvent = e.nativeEvent;
    const isComposing = isEventComposing(nativeEvent);
    const event = e;
    setEventProps(event);
    if (onKeyPress) {
      onKeyPress(event);
    }
    updateSelection(event);
    if (e.key === 'Enter' &&
    // Do not call submit if composition is occuring.
    !isComposing && !e.isDefaultPrevented()) {
      // prevent "Enter" from inserting a newline or submitting a form
      e.preventDefault();
      if (!e.shiftKey && (blurOnSubmit || !multiline) && onSubmitEditing) {
        onSubmitEditing(event);
      } else if (multiline) {
        //   We need to change normal behavior of "Enter" key to insert a line breaks, to prevent wrapping contentEditable text in <div> tags.
        //  Thanks to that in every situation we have proper amount of new lines in our parsed text. Without it pressing enter in empty lines will add 2 more new lines.
        document.execCommand('insertLineBreak');
        CursorUtils.scrollCursorIntoView(divRef.current);
      }
      if (!e.shiftKey && (shouldBlurOnSubmit && hostNode !== null || !multiline)) {
        setTimeout(() => divRef.current && divRef.current.blur(), 0);
      }
    }
  }, [multiline, blurOnSubmit, setEventProps, onKeyPress, updateSelection, handleOnChangeText, onSubmitEditing]);
  const handleFocus = (0, _react.useCallback)(event => {
    const e = event;
    const hostNode = e.target;
    currentlyFocusedField.current = hostNode;
    setEventProps(e);
    if (divRef.current) {
      const valueLength = value ? value.length : 0;
      CursorUtils.setCursorPosition(divRef.current, contentSelection.current ? contentSelection.current.end : valueLength);
      updateSelection(event);
    }
    if (onFocus) {
      setEventProps(e);
      onFocus(e);
    }
    if (hostNode !== null) {
      if (clearTextOnFocus && divRef.current) {
        divRef.current.innerText = '';
      }
      if (selectTextOnFocus) {
        // Safari requires selection to occur in a setTimeout
        if (focusTimeout !== null) {
          clearTimeout(focusTimeout);
        }
        focusTimeout = setTimeout(() => {
          if (hostNode === null) {
            return;
          }
          document.execCommand('selectAll', false, '');
        }, 0);
      }
    }
  }, [clearTextOnFocus, onFocus, selectTextOnFocus, setEventProps, updateSelection, value]);
  const handleBlur = (0, _react.useCallback)(event => {
    const e = event;
    CursorUtils.removeSelection();
    currentlyFocusedField.current = null;
    if (onBlur) {
      setEventProps(e);
      onBlur(e);
    }
  }, [onBlur, setEventProps]);
  const handleClick = (0, _react.useCallback)(e => {
    updateSelection(e);
    if (!onClick || !divRef.current) {
      return;
    }
    e.target.value = normalizeValue(divRef.current.innerText || '');
    onClick(e);
  }, [onClick, updateSelection]);
  const handlePaste = (0, _react.useCallback)(() => {
    pasteRef.current = true;
  }, []);
  const startComposition = (0, _react.useCallback)(() => {
    compositionRef.current = true;
  }, []);
  const setRef = currentRef => {
    const r = currentRef;
    if (r) {
      r.isFocused = () => document.activeElement === r;
      r.clear = () => {
        r.innerText = '';
        updateTextColor(r, '');
      };
      if (value === '' || value === undefined) {
        // update to placeholder color when value is empty
        updateTextColor(r, r.innerText);
      }
    }
    if (ref) {
      if (typeof ref === 'object') {
        // eslint-disable-next-line no-param-reassign
        ref.current = r;
      } else if (typeof ref === 'function') {
        ref(r);
      }
    }
    divRef.current = r;
  };
  useClientEffect(function parseAndStyleValue() {
    if (!divRef.current || processedValue === divRef.current.innerText) {
      return;
    }
    if (value === undefined) {
      parseText(divRef.current, divRef.current.innerText, processedMarkdownStyle);
      return;
    }
    const text = processedValue !== undefined ? processedValue : '';
    parseText(divRef.current, text, processedMarkdownStyle, text.length);
    updateTextColor(divRef.current, value);
  }, [multiline, processedMarkdownStyle, processedValue]);
  useClientEffect(function adjustHeight() {
    if (!divRef.current || !multiline) {
      return;
    }
    const elementHeight = getElementHeight(divRef.current, inputStyles, numberOfLines);
    divRef.current.style.height = elementHeight;
    divRef.current.style.maxHeight = elementHeight;
  }, [numberOfLines]);
  (0, _react.useEffect)(() => {
    if (!divRef.current) {
      return;
    }
    // focus the input on mount if autoFocus is set
    if (autoFocus) {
      divRef.current.focus();
    }
  }, [autoFocus]);
  (0, _react.useEffect)(() => {
    if (!divRef.current || !selection || contentSelection.current && selection.start === contentSelection.current.start && selection.end === contentSelection.current.end) {
      return;
    }
    CursorUtils.setCursorPosition(divRef.current, selection.start, selection.end);
    updateSelection(null, {
      start: selection.start,
      end: selection.end || selection.start
    });
  }, [selection, updateSelection]);
  (0, _react.useEffect)(() => {
    var _history$current;
    if (((_history$current = history.current) === null || _history$current === void 0 ? void 0 : _history$current.history.length) !== 0) {
      return;
    }
    const currentValue = value ?? '';
    history.current.add(currentValue, currentValue.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    /*#__PURE__*/
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    _react.default.createElement("div", {
      ref: setRef,
      contentEditable: !disabled,
      style: inputStyles,
      role: accessibilityRole || 'textbox',
      "aria-label": accessibilityLabel,
      "aria-labelledby": `${accessibilityLabelledBy}`,
      "aria-placeholder": heightSafePlaceholder,
      "aria-multiline": multiline,
      autoCorrect: autoCorrect ? 'on' : 'off',
      autoCapitalize: autoCapitalize,
      className: className,
      onKeyDown: handleKeyPress,
      onCompositionStart: startComposition,
      onKeyUp: updateSelection,
      onInput: handleOnChangeText,
      onClick: handleClick,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onPaste: handlePaste,
      placeholder: heightSafePlaceholder,
      spellCheck: spellCheck,
      dir: dir
    })
  );
});
const styles = _reactNative.StyleSheet.create({
  defaultInputStyles: {
    borderColor: 'black',
    borderWidth: 1,
    borderStyle: 'solid',
    fontFamily: 'sans-serif',
    // @ts-expect-error it works on web
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    overflowX: 'auto',
    overflowWrap: 'break-word'
  },
  disabledInputStyles: {
    opacity: 0.75,
    cursor: 'default'
  }
});
var _default = exports.default = MarkdownTextInput;
//# sourceMappingURL=MarkdownTextInput.web.js.map