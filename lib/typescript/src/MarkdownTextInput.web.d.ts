import type { TextInput, TextInputProps } from 'react-native';
import React from 'react';
import type { MouseEvent } from 'react';
import type * as MarkdownTextInputDecoratorViewNativeComponent from './MarkdownTextInputDecoratorViewNativeComponent';
import './web/MarkdownTextInput.css';
type MarkdownStyle = MarkdownTextInputDecoratorViewNativeComponent.MarkdownStyle;
interface MarkdownTextInputProps extends TextInputProps {
    markdownStyle?: MarkdownStyle;
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
    dir?: string;
    disabled?: boolean;
}
declare const MarkdownTextInput: React.ForwardRefExoticComponent<MarkdownTextInputProps & React.RefAttributes<TextInput>>;
export default MarkdownTextInput;
export type { MarkdownTextInputProps };
//# sourceMappingURL=MarkdownTextInput.web.d.ts.map