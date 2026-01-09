import { Box } from "@mui/material";
import { ReactNode } from "react";

export const renderLabel = (label: ReactNode, required?: boolean) => {
  if (!required) return label;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",

        "&::before": {
          content: '"✱"',
          color: "error.main",
          mr: "4px",
          fontSize: "0.5em",
          alignSelf: "center",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      {label}
    </Box>
  );
};