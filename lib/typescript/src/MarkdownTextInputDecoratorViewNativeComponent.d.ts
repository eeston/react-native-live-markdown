/// <reference types="react-native/types/modules/codegen" />
/// <reference types="react-native/codegen" />
import type { ColorValue, ViewProps } from 'react-native';
import type { Float } from 'react-native/Libraries/Types/CodegenTypes';
interface MarkdownStyle {
    syntax: {
        color: ColorValue;
    };
    emoji: {
        fontSize: Float;
    };
    link: {
        color: ColorValue;
    };
    h1: {
        fontSize: Float;
    };
    blockquote: {
        borderColor: ColorValue;
        borderWidth: Float;
        marginLeft: Float;
        paddingLeft: Float;
    };
    code: {
        fontFamily: string;
        color: ColorValue;
        backgroundColor: ColorValue;
    };
    pre: {
        fontFamily: string;
        color: ColorValue;
        backgroundColor: ColorValue;
    };
    mentionHere: {
        color: ColorValue;
        backgroundColor: ColorValue;
    };
    mentionUser: {
        color: ColorValue;
        backgroundColor: ColorValue;
    };
}
interface NativeProps extends ViewProps {
    markdownStyle: MarkdownStyle;
}
declare const _default: import("react-native/Libraries/Utilities/codegenNativeComponent").NativeComponentType<NativeProps>;
export default _default;
export type { MarkdownStyle };
//# sourceMappingURL=MarkdownTextInputDecoratorViewNativeComponent.d.ts.map