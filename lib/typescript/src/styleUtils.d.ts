import type * as MarkdownTextInputDecoractorView from './MarkdownTextInputDecoratorViewNativeComponent';
type MarkdownStyle = MarkdownTextInputDecoractorView.MarkdownStyle;
type PartialMarkdownStyle = Partial<{
    [K in keyof MarkdownStyle]: Partial<MarkdownStyle[K]>;
}>;
declare function mergeMarkdownStyleWithDefault(input: PartialMarkdownStyle | undefined): MarkdownStyle;
export type { PartialMarkdownStyle };
export { mergeMarkdownStyleWithDefault };
//# sourceMappingURL=styleUtils.d.ts.map