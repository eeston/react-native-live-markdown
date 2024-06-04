import * as CursorUtils from './cursorUtils';
import type * as StyleUtilsTypes from '../styleUtils';
import * as BrowserUtils from './browserUtils';

type PartialMarkdownStyle = StyleUtilsTypes.PartialMarkdownStyle;

type MarkdownType = 'bold' | 'italic' | 'strikethrough' | 'emoji' | 'link' | 'code' | 'pre' | 'blockquote' | 'h1' | 'syntax' | 'mention-here' | 'mention-user' | 'mention-report' | 'text';

type MarkdownRange = {
  type: MarkdownType;
  start: number;
  length: number;
  depth?: number;
};

type TreeItem = {
  element: HTMLElement | Text;
  parent: TreeItem | null;
  children: TreeItem[];
} & MarkdownRange;

type Paragraph = {
  text: string;
  start: number;
  length: number;
  markdownRanges: MarkdownRange[];
};

function addStyling(targetElement: HTMLElement, type: MarkdownType, markdownStyle: PartialMarkdownStyle) {
  const node = targetElement;
  switch (type) {
    case 'syntax':
      Object.assign(node.style, markdownStyle.syntax);
      break;
    case 'bold':
      node.style.fontWeight = 'bold';
      break;
    case 'italic':
      node.style.fontStyle = 'italic';
      break;
    case 'strikethrough':
      node.style.textDecoration = 'line-through';
      break;
    case 'emoji':
      Object.assign(node.style, markdownStyle.emoji);
      break;
    case 'mention-here':
      Object.assign(node.style, markdownStyle.mentionHere);
      break;
    case 'mention-user':
      Object.assign(node.style, markdownStyle.mentionUser);
      break;
    case 'mention-report':
      Object.assign(node.style, markdownStyle.mentionReport);
      break;
    case 'link':
      Object.assign(node.style, {
        ...markdownStyle.link,
        textDecoration: 'underline',
      });
      break;
    case 'code':
      Object.assign(node.style, markdownStyle.code);
      break;
    case 'pre':
      Object.assign(node.style, markdownStyle.pre);
      break;

    case 'blockquote':
      Object.assign(node.style, {
        ...markdownStyle.blockquote,
        borderLeftStyle: 'solid',
        display: 'inline-block',
        maxWidth: '100%',
        boxSizing: 'border-box',
      });
      break;
    case 'h1':
      Object.assign(node.style, {
        ...markdownStyle.h1,
        fontWeight: 'bold',
      });
      break;
    default:
      break;
  }
}

function ungroupRanges(ranges: MarkdownRange[]): MarkdownRange[] {
  const ungroupedRanges: MarkdownRange[] = [];
  ranges.forEach((range) => {
    if (!range.depth) {
      ungroupedRanges.push(range);
    }
    const {depth, ...rangeWithoutDepth} = range;
    Array.from({length: depth!}).forEach(() => {
      ungroupedRanges.push(rangeWithoutDepth);
    });
  });
  return ungroupedRanges;
}

function createParagraph(text: string | null = null) {
  const p = document.createElement('p');
  Object.assign(p.style, {
    margin: '0',
    padding: '0',
    display: 'block',
  });

  if (text === '') {
    p.appendChild(document.createElement('br'));
  } else if (text) {
    p.appendChild(document.createTextNode(text));
  }

  return p;
}

function parseRangesToHTMLNodes(text: string, ranges: MarkdownRange[], markdownStyle: PartialMarkdownStyle = {}, disableInlineStyles = false) {
  const root: HTMLElement = document.createElement('div');
  const tree: TreeItem[] = [];
  let currentTreeItem: TreeItem | null = null;
  const textLength = text.length;

  function addItemToTree(element: HTMLElement | Text, type: MarkdownType, start: number, length: number | null = null) {
    const contentLength = length || element.textContent!.length;
    const item: TreeItem = {
      element,
      parent: currentTreeItem,
      children: [],
      start,
      length: contentLength,
      type,
    };

    if (currentTreeItem) {
      currentTreeItem.children.push(item);
      currentTreeItem.element.appendChild(element);
    } else {
      tree.push(item);
      root.appendChild(element);
    }

    return item;
  }

  let lineStartIndex = 0;
  const lines: Paragraph[] = text.split('\n').map((line) => {
    const lineObject: Paragraph = {
      text: line,
      start: lineStartIndex,
      length: line.length,
      markdownRanges: [],
    };

    lineStartIndex += line.length + 1; // Adding 1 for the newline character
    return lineObject;
  });

  if (ranges.length === 0) {
    lines.forEach((line) => {
      addItemToTree(createParagraph(line.text), 'text', line.start, line.length);
    });
    return root;
  }

  const stack = ungroupRanges(ranges);

  // group ranges by line
  let lineIndex = 0;
  stack.forEach((range) => {
    const {start} = range;

    let currentLine = lines[lineIndex];
    while (currentLine && lineIndex < lines.length && start > currentLine.start + currentLine.length) {
      lineIndex += 1;
      currentLine = lines[lineIndex];
    }

    if (currentLine) {
      currentLine.markdownRanges.push({
        ...range,
        start: start - currentLine.start,
      });
    }
  });

  lines.forEach((line) => {
    currentTreeItem = null;
    currentTreeItem = addItemToTree(createParagraph(line.markdownRanges.length > 0 ? null : line.text), 'text', line.start, line.length);

    const lineStack = line.markdownRanges;
    let lastRangeEndIndex = 0;
    while (lineStack.length > 0) {
      const range = lineStack.shift();
      if (!range) {
        break;
      }
      const endOfCurrentRange = range.start + range.length;
      const nextRangeStartIndex = lineStack.length > 0 && !!lineStack[0] ? lineStack[0].start || 0 : textLength;

      const textBeforeRange = line.text.substring(lastRangeEndIndex, range.start);
      if (textBeforeRange) {
        addItemToTree(document.createTextNode(textBeforeRange), 'text', lastRangeEndIndex);
      }

      const span = document.createElement('span');
      if (disableInlineStyles) {
        span.className = range.type;
      } else {
        addStyling(span, range.type, markdownStyle);
      }

      if (stack.length > 0 && nextRangeStartIndex < endOfCurrentRange && range.type !== 'syntax') {
        // tag nesting
        currentTreeItem = addItemToTree(span, range.type, range.start, range.length);
        lastRangeEndIndex = range.start;
      } else {
        span.innerText = line.text.substring(range.start, endOfCurrentRange);
        addItemToTree(span, range.type, range.start, range.length);
        lastRangeEndIndex = endOfCurrentRange;

        while (currentTreeItem && nextRangeStartIndex >= currentTreeItem.start + currentTreeItem.length) {
          const textAfterRange = line.text.substring(lastRangeEndIndex, currentTreeItem.start + currentTreeItem.length);
          if (textAfterRange) {
            addItemToTree(document.createTextNode(textAfterRange), 'text', lastRangeEndIndex);
          }
          lastRangeEndIndex = currentTreeItem.start + currentTreeItem.length;
          currentTreeItem = currentTreeItem.parent;
        }
      }
    }
  });

  return root;
}

function moveCursor(isFocused: boolean, alwaysMoveCursorToTheEnd: boolean, cursorPosition: number | null, target: HTMLElement) {
  if (!isFocused) {
    return;
  }

  if (alwaysMoveCursorToTheEnd || cursorPosition === null) {
    CursorUtils.moveCursorToEnd(target);
  } else if (cursorPosition !== null) {
    CursorUtils.setCursorPosition(target, cursorPosition);
  }
}

function parseText(target: HTMLElement, text: string, curosrPositionIndex: number | null, markdownStyle: PartialMarkdownStyle = {}, alwaysMoveCursorToTheEnd = false) {
  const targetElement = target;

  let cursorPosition: number | null = curosrPositionIndex;
  const isFocused = document.activeElement === target;
  if (isFocused && curosrPositionIndex === null) {
    const selection = CursorUtils.getCurrentCursorPosition(target);
    cursorPosition = selection ? selection.end : null;
  }
  const ranges = global.parseExpensiMarkToRanges(text);
  const markdownRanges: MarkdownRange[] = ranges as MarkdownRange[];

  if (!text || targetElement.innerHTML === '<br>' || (targetElement && targetElement.innerHTML === '\n')) {
    targetElement.innerHTML = '';
    targetElement.innerText = '';
  }

  // We don't want to parse text with single '\n', because contentEditable represents it as invisible <br />
  if (text) {
    const dom = parseRangesToHTMLNodes(text, markdownRanges, markdownStyle);

    if (targetElement.innerHTML !== dom.innerHTML) {
      targetElement.innerHTML = '';
      targetElement.innerText = '';
      targetElement.innerHTML = dom.innerHTML || '';

      if (BrowserUtils.isChromium) {
        moveCursor(isFocused, alwaysMoveCursorToTheEnd, cursorPosition, target);
      }
    }

    if (!BrowserUtils.isChromium) {
      moveCursor(isFocused, alwaysMoveCursorToTheEnd, cursorPosition, target);
    }
  }

  moveCursor(isFocused, alwaysMoveCursorToTheEnd, cursorPosition, target);

  CursorUtils.setPrevText(target);

  return {text, cursorPosition: cursorPosition || 0};
}

export {parseText, parseRangesToHTMLNodes};

export type {MarkdownRange, MarkdownType};
