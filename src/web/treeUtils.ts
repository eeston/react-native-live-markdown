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

function addItemToTree(tree: TreeItem[], rootElement: HTMLElement, element: HTMLElement, type: ElementType, parentTreeItem: TreeItem | null, start: number, length: number | null = null) {
  const contentLength = length || element.textContent!.length;
  const item: TreeItem = {
    element,
    parent: parentTreeItem,
    children: [],
    relativeStart: start - (parentTreeItem?.start || 0),
    start,
    length: contentLength,
    type,
    orderIndex: !parentTreeItem ? `${rootElement.childNodes.length || 0}` : `${parentTreeItem.orderIndex},${parentTreeItem.children.length || 0}`,
  };

  element.setAttribute('data-id', item.orderIndex);

  if (parentTreeItem) {
    parentTreeItem.children.push(item);
    parentTreeItem.element.appendChild(element);
  } else {
    tree.push(item);
    rootElement.appendChild(element);
  }

  return item;
}

function findElementInTree(tree: TreeItem[], element: HTMLElement) {
  if (!element || !element.hasAttribute('data-id')) {
    return;
  }
  const indexes = element.getAttribute('data-id')?.split(',');
  let i = 0;
  let el: TreeItem | null = null;

  while (tree && indexes && indexes.length > 0) {
    const item = indexes.shift();
    if (!item) {
      break;
    }
    const index = Number(item);

    if (i === 0) {
      el = tree[index] || null;
    } else if (el && index) {
      el = el.children[index] || null;
    }

    if (el === null) {
      break;
    }

    i += 1;
  }

  return el;
}

export {addItemToTree, findElementInTree};

export type {TreeItem};
