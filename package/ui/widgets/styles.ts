/**
 * Widget 公共样式系统
 *
 * 提供统一的样式配置，确保所有表单组件视觉一致
 */

import { type SxProps, type Theme } from "@mui/material";

// ============================================================================
// 主题常量
// ============================================================================

/** 字段高度配置 */
export const FIELD_HEIGHT = {
  /** 紧凑模式高度 */
  compact: 40,
  /** 标准模式高度 */
  standard: 56,
} as const;

/** 字体大小配置 */
export const FONT_SIZE = {
  /** 标签字体大小 */
  label: 14,
  /** 输入框字体大小 */
  input: 14,
  /** 辅助文本字体大小 */
  helper: 12,
  /** 选项字体大小 */
  option: 14,
} as const;

/** 间距配置 */
export const SPACING = {
  /** 辅助文本上边距 */
  helperMarginTop: 4,
  /** 标签与控件间距 */
  labelGap: 8,
  /** 控件内边距 */
  inputPadding: "8px 12px",
} as const;

// ============================================================================
// 公共样式
// ============================================================================

/** 紧凑型表单字段样式 (TextField 系列) */
export const compactFieldStyles: SxProps<Theme> = {
  "& .MuiInputBase-input": {
    fontSize: FONT_SIZE.input,
    padding: SPACING.inputPadding,
  },
  "& .MuiInputLabel-root": {
    fontSize: FONT_SIZE.label,
    transform: "translate(14px, 9px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)",
    },
  },
  "& .MuiOutlinedInput-root": {
    minHeight: `${FIELD_HEIGHT.compact}px`,
  },
  "& .MuiFormHelperText-root": {
    marginTop: `${SPACING.helperMarginTop}px`,
    fontSize: FONT_SIZE.helper,
  },
  "& .MuiInputLabel-asterisk": {
    display: "none",
  },
};

/** FormControl 组件统一样式 (Radio, Checkbox, Switch 等) */
export const formControlStyles: SxProps<Theme> = {
  minHeight: `${FIELD_HEIGHT.compact}px`,
  justifyContent: "center",
  "& .MuiFormLabel-root": {
    fontSize: FONT_SIZE.label,
    "&.Mui-focused": {
      color: "text.primary",
    },
  },
  "& .MuiFormControlLabel-label": {
    fontSize: FONT_SIZE.option,
  },
  "& .MuiFormHelperText-root": {
    marginTop: `${SPACING.helperMarginTop}px`,
    fontSize: FONT_SIZE.helper,
    marginLeft: 0,
  },
};

/** 内联布局样式 (label 和控件在同一行) */
export const inlineLayoutStyles: SxProps<Theme> = {
  flexDirection: "row",
  alignItems: "center",
  minHeight: `${FIELD_HEIGHT.compact}px`,
  "& .MuiFormLabel-root": {
    fontSize: FONT_SIZE.label,
    marginBottom: 0,
    marginRight: 16,
    flexShrink: 0,
    "&.Mui-focused": {
      color: "text.primary",
    },
  },
  "& .MuiFormControlLabel-label": {
    fontSize: FONT_SIZE.option,
  },
  "& .MuiFormHelperText-root": {
    position: "absolute",
    bottom: -20,
    left: 0,
    marginTop: 0,
    fontSize: FONT_SIZE.helper,
  },
};

/** 带标签的控件容器样式 (Slider, Rating 等) */
export const labeledControlStyles: SxProps<Theme> = {
  "& .MuiFormLabel-root": {
    fontSize: FONT_SIZE.label,
    marginBottom: `${SPACING.labelGap}px`,
    "&.Mui-focused": {
      color: "text.primary",
    },
  },
  "& .MuiFormHelperText-root": {
    marginTop: `${SPACING.helperMarginTop}px`,
    fontSize: FONT_SIZE.helper,
    marginLeft: 0,
  },
};

// ============================================================================
// 日期格式
// ============================================================================

/** 日期格式 */
export const DATE_FORMAT = "YYYY-MM-DD";
export const TIME_FORMAT = "HH:mm";
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

// ============================================================================
// 主题配置类型
// ============================================================================

/** Widget 主题配置 */
export type WidgetThemeConfig = {
  /** 字段高度 */
  fieldHeight: number;
  /** 字体大小 */
  fontSize: {
    label: number;
    input: number;
    helper: number;
    option: number;
  };
  /** 间距 */
  spacing: {
    helperMarginTop: number;
    labelGap: number;
    inputPadding: string;
  };
};

/** 默认主题配置 */
export const defaultWidgetTheme: WidgetThemeConfig = {
  fieldHeight: FIELD_HEIGHT.compact,
  fontSize: { ...FONT_SIZE },
  spacing: { ...SPACING },
};

/**
 * 根据主题配置生成样式
 */
export function createWidgetStyles(theme: Partial<WidgetThemeConfig> = {}) {
  const config = { ...defaultWidgetTheme, ...theme };

  return {
    compactFieldStyles: {
      "& .MuiInputBase-input": {
        fontSize: config.fontSize.input,
        padding: config.spacing.inputPadding,
      },
      "& .MuiInputLabel-root": {
        fontSize: config.fontSize.label,
        transform: "translate(14px, 9px) scale(1)",
        "&.MuiInputLabel-shrink": {
          transform: "translate(14px, -9px) scale(0.75)",
        },
      },
      "& .MuiOutlinedInput-root": {
        minHeight: `${config.fieldHeight}px`,
      },
      "& .MuiFormHelperText-root": {
        marginTop: `${config.spacing.helperMarginTop}px`,
        fontSize: config.fontSize.helper,
      },
      "& .MuiInputLabel-asterisk": {
        display: "none",
      },
    },
    formControlStyles: {
      minHeight: `${config.fieldHeight}px`,
      justifyContent: "center",
      "& .MuiFormLabel-root": {
        fontSize: config.fontSize.label,
      },
      "& .MuiFormControlLabel-label": {
        fontSize: config.fontSize.option,
      },
      "& .MuiFormHelperText-root": {
        marginTop: `${config.spacing.helperMarginTop}px`,
        fontSize: config.fontSize.helper,
        marginLeft: 0,
      },
    },
  };
}