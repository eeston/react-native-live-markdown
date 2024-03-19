"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class InputHistory {
  currentText = null;
  timeout = null;
  constructor(depth, debounceTime = 200) {
    this.depth = depth;
    this.history = [];
    this.historyIndex = 0;
    this.debounceTime = debounceTime;
  }
  getCurrentItem() {
    return this.history[this.historyIndex] || null;
  }
  setHistory(newHistory) {
    this.history = newHistory.slice(newHistory.length - this.depth);
    this.historyIndex = newHistory.length - 1;
  }
  setHistoryIndex(index) {
    this.historyIndex = index;
  }
  clear() {
    this.history = [];
    this.historyIndex = 0;
  }
  debouncedAdd(text, cursorPosition) {
    this.currentText = text;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      if (this.currentText == null) {
        return;
      }
      this.add(this.currentText, cursorPosition);
      this.currentText = null;
    }, this.debounceTime);
  }
  add(text, cursorPosition) {
    if (this.history.length > 0) {
      const lastItem = this.history[this.history.length - 1];
      if (lastItem && text === lastItem.text) {
        return;
      }
    }
    if (this.historyIndex < this.history.length - 1) {
      this.history.splice(this.historyIndex + 1);
    }
    this.history.push({
      text,
      cursorPosition
    });
    if (this.history.length > this.depth) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }
  undo() {
    if (this.currentText !== null && this.timeout) {
      clearTimeout(this.timeout);
      return this.history[this.history.length - 1] || null;
    }
    if (this.history.length === 0 || this.historyIndex - 1 < 0) {
      return null;
    }
    if (this.historyIndex > 0) {
      this.historyIndex -= 1;
    }
    return this.history[this.historyIndex] || null;
  }
  redo() {
    if (this.currentText !== null && this.timeout) {
      clearTimeout(this.timeout);
      return this.history[this.history.length - 1] || null;
    }
    if (this.history.length === 0 || this.historyIndex + 1 > this.history.length) {
      return null;
    }
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex += 1;
    } else {
      return null;
    }
    return this.history[this.historyIndex] || null;
  }
}
exports.default = InputHistory;
//# sourceMappingURL=InputHistory.js.map