import React from "react";
import { SchemaFormExample } from "../../../src-next-trea/SchemaForm.example";
import { Typography, Box, Paper } from "@mui/material";

export default function NextDemo() {
  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          TanStack Form Rewrite Demo (src-next)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Testing the new 3-layer architecture: Compiler -&gt; Runtime -&gt; UI
        </Typography>

        <SchemaFormExample />
      </Paper>
    </Box>
  );
}
