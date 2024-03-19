declare module 'expect' {
    interface AsymmetricMatchers {
        toBeParsedAsHTML(expectedHTML: string): void;
    }
    interface Matchers<R> {
        toBeParsedAsHTML(expectedHTML: string): R;
    }
}
export {};
//# sourceMappingURL=webParser.test.d.ts.map