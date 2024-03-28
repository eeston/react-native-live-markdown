import type * as StyleUtilsTypes from '../styleUtils';
type PartialMarkdownStyle = StyleUtilsTypes.PartialMarkdownStyle;
type MarkdownType = 'bold' | 'italic' | 'strikethrough' | 'emoji' | 'link' | 'code' | 'pre' | 'blockquote' | 'h1' | 'syntax' | 'mention-here' | 'mention-user';
type MarkdownRange = {
    type: MarkdownType;
    start: number;
    length: number;
    depth?: number;
};
declare function parseRangesToHTMLNodes(text: string, ranges: MarkdownRange[], markdownStyle?: PartialMarkdownStyle, disableInlineStyles?: boolean): HTMLElement;
declare function parseText(target: HTMLElement, text: string, curosrPositionIndex: number | null, markdownStyle?: PartialMarkdownStyle, alwaysMoveCursorToTheEnd?: boolean): {
    text: string;
    cursorPosition: number;
};
export { parseText, parseRangesToHTMLNodes };
export type { MarkdownRange, MarkdownType };
//# sourceMappingURL=parserUtils.d.ts.map