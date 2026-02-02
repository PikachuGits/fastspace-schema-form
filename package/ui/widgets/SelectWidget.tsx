import {
  AutocompleteWidgetRender,
  AutocompleteWidget,
  type AutocompleteWidgetProps,
  type AutocompleteWidgetRenderProps,
  type OptionItem,
  type ButtonConfig,
  type SuffixButtonRender,
} from "./AutocompleteWidget";

// ============================================================================
// Types - Re-export from AutocompleteWidget for backward compatibility
// ============================================================================

export type SelectWidgetProps = AutocompleteWidgetProps;
export type SelectWidgetRenderProps = AutocompleteWidgetRenderProps;
export type { OptionItem, ButtonConfig, SuffixButtonRender };

// ============================================================================
// Components - Alias to AutocompleteWidget
// ============================================================================

/**
 * SelectWidget is now an alias for AutocompleteWidget.
 * It provides unified functionality using MUI Autocomplete.
 */
export const SelectWidgetRender = AutocompleteWidgetRender;
export const SelectWidget = AutocompleteWidget;

export default SelectWidgetRender;
