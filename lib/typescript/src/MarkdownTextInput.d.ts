import { TextInput } from 'react-native';
import React from 'react';
import type { TextInputProps } from 'react-native';
import type * as StyleUtilsTypes from './styleUtils';
type PartialMarkdownStyle = StyleUtilsTypes.PartialMarkdownStyle;
interface MarkdownTextInputProps extends TextInputProps {
    markdownStyle?: PartialMarkdownStyle;
}
declare const MarkdownTextInput: React.ForwardRefExoticComponent<MarkdownTextInputProps & React.RefAttributes<TextInput>>;
export type { PartialMarkdownStyle as MarkdownStyle, MarkdownTextInputProps };
export default MarkdownTextInput;
//# sourceMappingURL=MarkdownTextInput.d.ts.map