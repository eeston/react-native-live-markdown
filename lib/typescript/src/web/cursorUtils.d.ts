declare function setCursorPosition(target: HTMLElement, start: number, end?: number | null): void;
declare function moveCursorToEnd(target: HTMLElement): void;
declare function getCurrentCursorPosition(target: HTMLElement): {
    start: number;
    end: number;
} | null;
declare function removeSelection(): void;
declare function scrollCursorIntoView(target: HTMLInputElement): void;
export { getCurrentCursorPosition, moveCursorToEnd, setCursorPosition, removeSelection, scrollCursorIntoView };
//# sourceMappingURL=cursorUtils.d.ts.map