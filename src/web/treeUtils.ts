import type * as ParserUtilsTypes from './parserUtils';

type MarkdownType = ParserUtilsTypes.MarkdownType;

type MarkdownRange = ParserUtilsTypes.MarkdownRange;

type ElementType = MarkdownType | 'line' | 'text' | 'br';

type TreeItem = Omit<MarkdownRange, 'type'> & {
  element: HTMLElement;
  parent: TreeItem | null;
  children: TreeItem[];
  relativeStart: number;
  type: ElementType;
  orderIndex: string;
};

function addItemToTree(element: HTMLElement, parentTreeItem: TreeItem, type: ElementType) {
  const contentLength = element.innerText.length;
  const parentChildrenCount = parentTreeItem?.children.length || 0;

  let startIndex = parentTreeItem.start;
  if (parentChildrenCount > 0) {
    const lastParentChild = parentTreeItem.children[parentChildrenCount - 1];
    if (lastParentChild) {
      startIndex = lastParentChild.start + lastParentChild.length;
      startIndex += lastParentChild.type === 'line' ? 1 : 0;
    }
  }

  const item: TreeItem = {
    element,
    parent: parentTreeItem,
    children: [],
    relativeStart: startIndex - (parentTreeItem?.start || 0),
    start: startIndex,
    length: contentLength,
    type,
    orderIndex: parentTreeItem.parent === null ? `${parentChildrenCount}` : `${parentTreeItem.orderIndex},${parentChildrenCount}`,
  };

  element.setAttribute('data-id', item.orderIndex);
  parentTreeItem.children.push(item);
  return item;
}

function buildTree(rootElement: HTMLElement, text: string) {
  const rootTreeItem: TreeItem = {
    element: rootElement,
    parent: null,
    children: [],
    relativeStart: 0,
    start: 0,
    length: text.replace(/\n/g, '\\n').length,
    type: 'text',
    orderIndex: '',
  };
  const stack = [rootTreeItem];
  while (stack.length > 0) {
    const treeItem = stack.pop();
    if (!treeItem) {
      break;
    }

    Array.from(treeItem.element.children).forEach((childElement) => {
      const newTreeItem = addItemToTree(childElement as HTMLElement, treeItem, (childElement.getAttribute('data-type') as ElementType) || childElement.nodeName === 'BR' ? 'br' : 'text');
      stack.push(newTreeItem);
    });
  }
  return rootTreeItem;
}

function findElementInTree(treeRoot: TreeItem, element: HTMLElement) {
  if (!element || !element.hasAttribute('data-id')) {
    return;
  }
  const indexes = element.getAttribute('data-id')?.split(',');
  let el: TreeItem | null = treeRoot;

  while (el && indexes && indexes.length > 0) {
    const index = Number(indexes.shift() || -1);
    if (index < 0) {
      break;
    }

    if (el) {
      el = el.children[index] || null;
    }
  }

  return el;
}

function getElementByIndex(treeRoot: TreeItem, index: number) {
  let el: TreeItem | null = treeRoot;

  let i = 0;
  while (el && el.children.length > 0 && i < el.children.length) {
    const child = el.children[i] as TreeItem;

    if (!child) {
      break;
    }

    if (index >= child.start && index <= child.start + child.length) {
      if (child.children.length === 0) {
        return child;
      }
      el = child;
      i = 0;
    } else {
      i++;
    }
  }
  return null;
}

export {addItemToTree, findElementInTree, getElementByIndex, buildTree};

export type {TreeItem};
