"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCurrentCursorPosition = getCurrentCursorPosition;
exports.moveCursorToEnd = moveCursorToEnd;
exports.removeSelection = removeSelection;
exports.scrollCursorIntoView = scrollCursorIntoView;
exports.setCursorPosition = setCursorPosition;
exports.setPrevText = setPrevText;
var BrowserUtils = _interopRequireWildcard(require("./browserUtils"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let prevTextLength;
function findTextNodes(textNodes, node) {
  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node);
  } else {
    for (let i = 0, length = node.childNodes.length; i < length; ++i) {
      const childNode = node.childNodes[i];
      if (childNode) {
        findTextNodes(textNodes, childNode);
      }
    }
  }
}
function setPrevText(target) {
  var _textNodes$map;
  let text = [];
  const textNodes = [];
  findTextNodes(textNodes, target);
  text = (_textNodes$map = textNodes.map(e => e.nodeValue ?? '')) === null || _textNodes$map === void 0 || (_textNodes$map = _textNodes$map.join('')) === null || _textNodes$map === void 0 ? void 0 : _textNodes$map.split('');
  prevTextLength = text.length;
}
function setCursorPosition(target, start, end = null) {
  var _textNodes$map2;
  const range = document.createRange();
  range.selectNodeContents(target);
  const textNodes = [];
  findTextNodes(textNodes, target);

  // These are utilities for handling the boundary cases (especially onEnter)
  // prevChar & nextChar are characters before & after the target cursor position
  const textCharacters = (_textNodes$map2 = textNodes.map(e => e.nodeValue ?? '')) === null || _textNodes$map2 === void 0 || (_textNodes$map2 = _textNodes$map2.join('')) === null || _textNodes$map2 === void 0 ? void 0 : _textNodes$map2.split('');
  const prevChar = (textCharacters === null || textCharacters === void 0 ? void 0 : textCharacters[start - 1]) ?? '';
  const nextChar = (textCharacters === null || textCharacters === void 0 ? void 0 : textCharacters[start]) ?? '';
  let charCount = 0;
  let startNode = null;
  let endNode = null;
  const n = textNodes.length;
  for (let i = 0; i < n; ++i) {
    const textNode = textNodes[i];
    if (textNode) {
      const nextCharCount = charCount + textNode.length;
      if (!startNode && start >= charCount && (start <= nextCharCount || start === nextCharCount && i < n - 1)) {
        startNode = textNode;

        // There are 4(/5) cases to consider here:
        // 1. Caret in front of a character, when pressing enter
        // 2. Caret at the end of a line (not last one)
        // 3a. Caret at the end of whole input, when pressing enter - On firefox
        // 3b. Caret at the end of whole input, when pressing enter - On other browsers
        // 4. All other placements
        if (prevChar === '\n' && prevTextLength !== undefined && prevTextLength < textCharacters.length) {
          if (nextChar !== '\n') {
            range.setStart(textNodes[i + 1], 0);
          } else if (i !== textNodes.length - 1) {
            range.setStart(textNodes[i], 1);
          } else if (BrowserUtils.isFirefox) {
            range.setStart(textNode, start - charCount);
          } else {
            range.setStart(textNodes[i], 2);
          }
        } else {
          range.setStart(textNode, start - charCount);
        }
        if (!end) {
          break;
        }
      }
      if (end && !endNode && end >= charCount && (end <= nextCharCount || end === nextCharCount && i < n - 1)) {
        endNode = textNode;
        range.setEnd(textNode, end - charCount);
      }
      charCount = nextCharCount;
    }
  }
  if (!end) {
    range.collapse(true);
  }
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
  scrollCursorIntoView(target);
}
function moveCursorToEnd(target) {
  const range = document.createRange();
  const selection = window.getSelection();
  if (selection) {
    range.setStart(target, target.childNodes.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
function getCurrentCursorPosition(target) {
  const selection = window.getSelection();
  if (!selection || selection && selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(target);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;
  const end = start + range.toString().length;
  return {
    start,
    end
  };
}
function removeSelection() {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}
function scrollCursorIntoView(target) {
  if (target.selectionStart === null || !target.value || BrowserUtils.isFirefox) {
    return;
  }
  const selection = window.getSelection();
  if (!selection || selection && selection.rangeCount === 0) {
    return;
  }
  const caretRect = selection.getRangeAt(0).getClientRects()[0];
  const editableRect = target.getBoundingClientRect();

  // Adjust for padding and border
  const paddingTop = parseFloat(window.getComputedStyle(target).paddingTop);
  const borderTop = parseFloat(window.getComputedStyle(target).borderTopWidth);
  if (caretRect && !(caretRect.top >= editableRect.top + paddingTop + borderTop && caretRect.bottom <= editableRect.bottom - 2 * (paddingTop - borderTop))) {
    const topToCaret = caretRect.top - editableRect.top;
    const inputHeight = editableRect.height;
    // Chrome Rects don't include padding & border, so we're adding them manually
    const inputOffset = caretRect.height - inputHeight + paddingTop + borderTop + (BrowserUtils.isChromium ? 0 : 4 * (paddingTop + borderTop));
    target.scrollTo(0, topToCaret + target.scrollTop + inputOffset);
  }
}
//# sourceMappingURL=cursorUtils.js.map