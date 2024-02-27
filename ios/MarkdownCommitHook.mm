
#ifdef RCT_NEW_ARCH_ENABLED

#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#include <React/RCTUtils.h>

#include "MarkdownCommitHook.h"
#include "MarkdownShadowFamilyRegistry.h"
#include "RCTMarkdownStyle.h"
#include "RCTMarkdownUtils.h"

using namespace facebook::react;

namespace livemarkdown {

MarkdownCommitHook::MarkdownCommitHook(const std::shared_ptr<UIManager> &uiManager) : uiManager_(uiManager) {
  uiManager_->registerCommitHook(*this);
}

MarkdownCommitHook::~MarkdownCommitHook() noexcept {
  uiManager_->unregisterCommitHook(*this);
}

RootShadowNode::Unshared MarkdownCommitHook::shadowTreeWillCommit(
    ShadowTree const &,
    RootShadowNode::Shared const &,
    RootShadowNode::Unshared const &newRootShadowNode) noexcept {
        auto rootNode = newRootShadowNode->ShadowNode::clone(ShadowNodeFragment{});

        // A preface to why we do the weird thing below:
        // On the new architecture there are two ways of measuring text on iOS: by value and by pointer.
        // When done by value, the attributed string to be measured is created on the c++ side. We cannot
        // modify this process as we do not extend TextInputShadowNode. We also cannot really change the
        // layout manager used to do this, since it's a private field (ok, we can but in a not very nice way).
        // But also, the logic for parsing and applying markdown is written in JS/ObjC and we really wouldn't
        // want to reimplement it in c++.
        //
        // Nice thing is that it can also be done by pointer to NSAttributedString, which is the platform's
        // way to handle styled text, and is also used by Live Markdown. On this path, the measurement is done
        // by the OS APIs. The thing we want to make sure of, is that markdown-decorated text input always uses
        // this path and uses a pointer to a string with markdown styles applied. Thankfully, RN provides nice
        // utility functions that allow to convert between the RN's AttributedString and iOS's NSAttributedString.
        // The logic below does exactly that.
        
        // In order to properly apply markdown formatting to the text input, we need to update the TextInputShadowNode's
        // state with styled string, but we only have access to the ShadowNodeFamilies of the decorator components.
        // We also know that a markdown decorator is always preceded with the TextInput to decorate, so we need to take
        // the sibling.
        std::vector<MarkdownTextInputDecoratorPair> nodesToUpdate;
        MarkdownShadowFamilyRegistry::runForEveryFamily([&rootNode, &nodesToUpdate](ShadowNodeFamily::Shared family) {
         // get the path from the root to the node from the decorator family
         auto ancestors = family->getAncestors(*rootNode);
         
         if (!ancestors.empty()) {
             auto &parentNode = ancestors.back().first.get();
             auto index = ancestors.back().second;
             
             // this is node represented by one of the registered families and since we only register markdown decorator
             // shadow families, static casting should be safe here
             const auto& decoratorNode =
                std::static_pointer_cast<const MarkdownTextInputDecoratorShadowNode>(parentNode.getChildren().at(index));
             // text input always precedes the decorator component
             const auto& previousSibling = parentNode.getChildren().at(index - 1);
             
             if (const auto& textInputNode = std::dynamic_pointer_cast<const TextInputShadowNode>(previousSibling)) {
                 // store the pair of text input and decorator to update in the next step
                 // we need both, decorator to get markdown style and text input to update it
                 nodesToUpdate.push_back({
                    textInputNode,
                    decoratorNode,
                 });
             }
         }
         });
        
        for (auto &nodes : nodesToUpdate) {
            const auto &textInputState = *std::static_pointer_cast<const ConcreteState<TextInputState>>(nodes.textInput->getState());
            const auto &stateData = textInputState.getData();
            
            // We only want to update the shadow node when the attributed string is stored by value
            // If it's stored by pointer, the markdown formatting should already by applied to it, since the
            // only source of that pointer (besides this commit hook) is RCTTextInputComponentView, which
            // has the relevant method swizzled to make sure the markdown styles are always applied before
            // updating state
            // There is one caveat, on the first render the swizzled method will not apply markdown since
            // the native component is not mounted yet. In that case we save the tag to update in the
            // method applying markdown formatting and apply it here instead, preventing wrong layout
            // on reloads.
            if (stateData.attributedStringBox.getMode() == AttributedStringBox::Mode::Value || MarkdownShadowFamilyRegistry::shouldForceUpdate(nodes.textInput->getTag())) {
                rootNode = rootNode->cloneTree(nodes.textInput->getFamily(), [&nodes, &textInputState, &stateData](const ShadowNode& node) {
                    const auto &markdownProps = *std::static_pointer_cast<MarkdownTextInputDecoratorViewProps const>(nodes.decorator->getProps());
                    const auto &textInputProps = *std::static_pointer_cast<TextInputProps const>(nodes.textInput->getProps());
                    
                    const auto defaultTextAttributes = textInputProps.getEffectiveTextAttributes(RCTFontSizeMultiplier());
                    const auto defaultNSTextAttributes = RCTNSTextAttributesFromTextAttributes(defaultTextAttributes);
                    
                    // this can possibly be optimized
                    RCTMarkdownStyle *markdownStyle = [[RCTMarkdownStyle alloc] initWithStruct:markdownProps.markdownStyle];
                    RCTMarkdownUtils *utils = [[RCTMarkdownUtils alloc] init];
                    [utils setMarkdownStyle:markdownStyle];
                    
                    // convert the attibuted string stored in state to NSAttributedString
                    auto nsAttributedString = RCTNSAttributedStringFromAttributedStringBox(stateData.attributedStringBox);
                    
                    // Handles the first render, where the text stored in props is different than the one stored in state
                    // The one in state is empty, while the one in props is passed from JS
                    // If we don't update the state here, we'll end up with a one-default-line-sized text input.
                    // A better condition to do that can be probably chosen, but this seems to work
                    auto plainString = std::string([[nsAttributedString string] UTF8String]);
                    if (plainString != textInputProps.text) {
                        // creates new AttributedString from props, adapted from TextInputShadowNode (ios one, text inputs are platform-specific)
                        auto attributedString = AttributedString{};
                        attributedString.appendFragment(
                            AttributedString::Fragment{textInputProps.text, defaultTextAttributes});

                        auto attachments = BaseTextShadowNode::Attachments{};
                        BaseTextShadowNode::buildAttributedString(
                            defaultTextAttributes, *nodes.textInput, attributedString, attachments);
                        
                        // convert the newly created attributed string to NSAttributedString
                        nsAttributedString = RCTNSAttributedStringFromAttributedStringBox(AttributedStringBox{attributedString});
                    }
                    
                    // apply markdown
                    auto newString = [utils parseMarkdown:nsAttributedString withAttributes:defaultNSTextAttributes];
                    
                    // create a clone of the old TextInputState and update the attributed string box to point to the string with markdown applied
                    auto newStateData = std::make_shared<TextInputState>(stateData);
                    newStateData->attributedStringBox = RCTAttributedStringBoxFromNSAttributedString(newString);
                    
                    // clone the text input with the new state
                    return node.clone({
                        .state = std::make_shared<const ConcreteState<TextInputState>>(newStateData, textInputState),
                    });
                });
            }
        }

  return std::static_pointer_cast<RootShadowNode>(rootNode);
}

} // namespace livemarkdown

#endif // RCT_NEW_ARCH_ENABLED
