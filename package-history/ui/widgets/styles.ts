/**
 * Widget 公共样式
 */

/** 紧凑型表单字段样式 */
export const compactFieldStyles = {
  "& .MuiInputBase-input": {
    fontSize: 14,
    padding: "8px 12px",
  },
  "& .MuiInputLabel-root": {
    fontSize: 14,
    transform: "translate(14px, 9px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)",
    },
  },
  "& .MuiOutlinedInput-root": {
    minHeight: "40px",
  },
  "& .MuiFormHelperText-root": {
    marginTop: "4px",
    fontSize: 12,
  },
  "& .MuiInputLabel-asterisk": {
    display: "none",
  },
};

/** 日期格式 */
export const DATE_FORMAT = "YYYY-MM-DD";
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm";

