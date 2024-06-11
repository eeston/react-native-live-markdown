import * as CursorUtils from './cursorUtils';
import type * as StyleUtilsTypes from '../styleUtils';
import * as BrowserUtils from './browserUtils';

type PartialMarkdownStyle = StyleUtilsTypes.PartialMarkdownStyle;

type MarkdownType = 'bold' | 'italic' | 'strikethrough' | 'emoji' | 'link' | 'code' | 'pre' | 'blockquote' | 'h1' | 'syntax' | 'mention-here' | 'mention-user' | 'mention-report';

type MarkdownRange = {
  type: MarkdownType;
  start: number;
  length: number;
  depth?: number;
};

type ElementType = MarkdownType | 'text' | 'br';

type TreeItem = Omit<MarkdownRange, 'type'> & {
  element: HTMLElement | Text;
  parent: TreeItem | null;
  children: TreeItem[];
  relativeStart: number;
  type: ElementType;
};

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

function addItemToTree(
  tree: TreeItem[],
  rootElement: HTMLElement,
  element: HTMLElement | Text,
  type: ElementType,
  parentTreeItem: TreeItem | null,
  start: number,
  length: number | null = null,
) {
  const contentLength = length || element.textContent!.length;
  const item: TreeItem = {
    element,
    parent: parentTreeItem,
    children: [],
    relativeStart: start - (parentTreeItem?.start || 0),
    start,
    length: contentLength,
    type,
  };

  if (parentTreeItem) {
    parentTreeItem.children.push(item);
    parentTreeItem.element.appendChild(element);
  } else {
    tree.push(item);
    rootElement.appendChild(element);
  }

  return item;
}

function splitTextIntoLines(text: string): Paragraph[] {
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

  return lines;
}

function mergeLinesWithMultilineTags(lines: Paragraph[]) {
  let multiLineRange: MarkdownRange | null = null;
  let lineWithMultilineTag: Paragraph | null = null;
  let i = 0;
  while (i < lines.length) {
    const currentLine = lines[i];
    if (!currentLine) {
      break;
    }
    // start merging if line contains range that ends in a different line
    if (lineWithMultilineTag && multiLineRange && currentLine.start <= multiLineRange.start + multiLineRange.length) {
      lineWithMultilineTag.text += `\n${currentLine.text}`;
      lineWithMultilineTag.markdownRanges.push(...currentLine.markdownRanges);
      lineWithMultilineTag.length += currentLine.length + 1;
      lines.splice(i, 1);
    } else {
      multiLineRange = currentLine.markdownRanges.find((range) => range.start + range.length > currentLine.start + currentLine.length) || null;
      lineWithMultilineTag = multiLineRange ? currentLine : null;
      i += 1;
    }
  }
}

function groupMarkdownRangesByLine(lines: Paragraph[], ranges: MarkdownRange[]) {
  let lineIndex = 0;
  ranges.forEach((range) => {
    const {start} = range;

    let currentLine = lines[lineIndex];
    while (currentLine && lineIndex < lines.length && start > currentLine.start + currentLine.length) {
      lineIndex += 1;
      currentLine = lines[lineIndex];
    }

    if (currentLine) {
      currentLine.markdownRanges.push(range);
    }
  });
}

function addTextToElement(tree: TreeItem[], rootElement: HTMLElement, parentTreeItem: TreeItem | null, text: string) {
  const lines = text.split('\n');
  let startIndex = parentTreeItem?.start || 0;
  lines.forEach((line, index) => {
    if (line !== '') {
      const span = document.createElement('span');
      span.innerText = line;
      addItemToTree(tree, rootElement, span, 'text', parentTreeItem, startIndex, line.length);
    }

    startIndex += line.length;

    if (index < lines.length - 1) {
      addItemToTree(tree, rootElement, document.createElement('br'), 'br', parentTreeItem, startIndex, 1);
      startIndex += 1;
    }
  });
}

function parseRangesToHTMLNodes(text: string, ranges: MarkdownRange[], markdownStyle: PartialMarkdownStyle = {}, disableInlineStyles = false) {
  const root: HTMLElement = document.createElement('div');
  const tree: TreeItem[] = [];
  let parentTreeItem: TreeItem | null = null;
  const textLength = text.length;
  const lines = splitTextIntoLines(text);

  if (ranges.length === 0) {
    lines.forEach((line) => {
      addItemToTree(tree, root, createParagraph(line.text), 'text', parentTreeItem, line.start, line.length);
    });
    return {dom: root, tree};
  }

  const markdownRanges = ungroupRanges(ranges);

  groupMarkdownRangesByLine(lines, markdownRanges);
  mergeLinesWithMultilineTags(lines);

  let lastRangeEndIndex = 0;
  while (lines.length > 0) {
    const line = lines.shift();
    if (!line) {
      break;
    }

    // preparing line paragraph element for markdown text
    parentTreeItem = null;
    parentTreeItem = addItemToTree(tree, root, createParagraph(null), 'text', parentTreeItem, line.start, line.length);
    if (line.markdownRanges.length === 0) {
      addTextToElement(tree, root, parentTreeItem, line.text);
    }

    lastRangeEndIndex = line.start;

    const lineMarkdownRanges = line.markdownRanges;
    // go through all markdown ranges in the line
    while (lineMarkdownRanges.length > 0) {
      const range = lineMarkdownRanges.shift();
      if (!range) {
        break;
      }

      const endOfCurrentRange = range.start + range.length;
      const nextRangeStartIndex = lineMarkdownRanges.length > 0 && !!lineMarkdownRanges[0] ? lineMarkdownRanges[0].start || 0 : textLength;

      // add text before the markdown range
      const textBeforeRange = line.text.substring(lastRangeEndIndex - line.start, range.start - line.start);
      if (textBeforeRange) {
        addTextToElement(tree, root, parentTreeItem, textBeforeRange);
      }

      // create markdown span element
      const span = document.createElement('span');
      if (disableInlineStyles) {
        span.className = range.type;
      } else {
        addStyling(span, range.type, markdownStyle);
      }

      if (lineMarkdownRanges.length > 0 && nextRangeStartIndex < endOfCurrentRange && range.type !== 'syntax') {
        // tag nesting
        parentTreeItem = addItemToTree(tree, root, span, range.type, parentTreeItem, range.start, range.length);
        lastRangeEndIndex = range.start;
      } else {
        // adding markdown tag
        const spanTreeItem = addItemToTree(tree, root, span, range.type, parentTreeItem, range.start, range.length);
        addTextToElement(tree, root, spanTreeItem, text.substring(range.start, endOfCurrentRange));

        lastRangeEndIndex = endOfCurrentRange;

        // tag unnesting and adding text after the tag
        while (parentTreeItem && nextRangeStartIndex >= parentTreeItem.start + parentTreeItem.length) {
          const textAfterRange = line.text.substring(lastRangeEndIndex - line.start, parentTreeItem.start - line.start + parentTreeItem.length);
          if (textAfterRange) {
            addTextToElement(tree, root, parentTreeItem, textAfterRange);
          }
          lastRangeEndIndex = parentTreeItem.start + parentTreeItem.length;
          parentTreeItem = parentTreeItem.parent;
        }
      }
    }
  }

  return {dom: root, tree};
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
  let elementTree: TreeItem[] = [];

  if (!text || targetElement.innerHTML === '<br>' || (targetElement && targetElement.innerHTML === '\n')) {
    targetElement.innerHTML = '';
    targetElement.innerText = '';
  }

  // We don't want to parse text with single '\n', because contentEditable represents it as invisible <br />
  if (text) {
    const {dom, tree} = parseRangesToHTMLNodes(text, markdownRanges, markdownStyle);
    elementTree = tree;
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

  return {text, cursorPosition: cursorPosition || 0, elementTree};
}

export {parseText, parseRangesToHTMLNodes};

export type {MarkdownRange, MarkdownType, TreeItem};
