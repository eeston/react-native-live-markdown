import type * as ParserUtilsTypes from './parserUtils';

type MarkdownType = ParserUtilsTypes.MarkdownType;

type MarkdownRange = ParserUtilsTypes.MarkdownRange;

type ElementType = MarkdownType | 'text' | 'br';

type TreeItem = Omit<MarkdownRange, 'type'> & {
  element: HTMLElement | Text;
  parent: TreeItem | null;
  children: TreeItem[];
  relativeStart: number;
  type: ElementType;
  orderIndex: string;
};

function addItemToTree(element: HTMLElement, type: ElementType, parentTreeItem: TreeItem, start: number, length: number | null = null) {
  const contentLength = length || element.textContent!.length;
  const parentChildrenCount = parentTreeItem?.children.length || 0;
  const item: TreeItem = {
    element,
    parent: parentTreeItem,
    children: [],
    relativeStart: start - (parentTreeItem?.start || 0),
    start,
    length: contentLength,
    type,
    orderIndex: parentTreeItem.parent === null ? `${parentChildrenCount}` : `${parentTreeItem.orderIndex},${parentChildrenCount}`,
  };

  element.setAttribute('data-id', item.orderIndex);

  parentTreeItem.children.push(item);
  parentTreeItem.element.appendChild(element);

  return item;
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

export {addItemToTree, findElementInTree};

export type {TreeItem};
