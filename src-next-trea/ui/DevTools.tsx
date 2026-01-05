import React, { useState, useEffect } from "react";
import {
  Box,
  Fab,
  Drawer,
  Tabs,
  Tab,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Chip,
  Tooltip,
  Button,
  Stack,
  Collapse,
} from "@mui/material";
import {
  BugReport as BugIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  DataObject as DataIcon,
  List as ListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useRuntime } from "../react/SchemaFormProvider";
import { useRuntimeTraces } from "../react/useRuntimeTraces";
import type { FieldMeta } from "../core/runtime/EffectSystem";

// ============================================================================
// Types
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`devtools-tabpanel-${index}`}
      aria-labelledby={`devtools-tab-${index}`}
      {...other}
      style={{ height: "100%", overflow: "auto" }}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

const TraceItem = ({ trace }: { trace: any }) => {
  const [expanded, setExpanded] = useState(false);

  // Format duration color
  const getDurationColor = (duration: number) => {
    if (duration > 100) return "error";
    if (duration > 50) return "warning";
    return "success";
  };

  return (
    <Paper sx={{ mb: 1, p: 1, bgcolor: "background.default" }} variant="outlined">
      <Box
        sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <Chip
          label={new Date(trace.timestamp).toLocaleTimeString()}
          size="small"
          variant="outlined"
          sx={{ mr: 1, fontSize: "0.7rem" }}
        />
        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: "bold" }}>
          {trace.type.toUpperCase()}
        </Typography>
        <Chip
          label={`${trace.duration.toFixed(1)}ms`}
          size="small"
          color={getDurationColor(trace.duration)}
          sx={{ mr: 1, height: 20 }}
        />
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Target: {trace.target}
        </Typography>
        {trace.deps && (
          <Typography variant="caption" color="text.secondary" display="block">
            Deps: {trace.deps.join(", ")}
          </Typography>
        )}
      </Box>

      <Collapse in={expanded}>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ maxHeight: 200, overflow: "auto" }}>
          <Typography variant="caption" component="div">
            <pre style={{ margin: 0 }}>
              {JSON.stringify(trace.result, null, 2)}
            </pre>
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

const FieldsView = () => {
  const runtime = useRuntime();
  // Simple polling for field updates
  const [fields, setFields] = useState<Record<string, { runtimeMeta: FieldMeta | undefined, formMeta: any, value: any }>>({});

  useEffect(() => {
    const update = () => {
      const allRuntimeMeta = runtime.getAllMeta();
      const form = runtime.getForm();
      const newFields: any = {};

      // Get all field names from runtime meta
      const allKeys = Object.keys(allRuntimeMeta);

      allKeys.forEach(key => {
        newFields[key] = {
          runtimeMeta: allRuntimeMeta[key],
          formMeta: form.getFieldMeta(key),
          value: form.getFieldValue(key)
        };
      });
      setFields(newFields);
    };
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, [runtime]);

  return (
    <List dense>
      {Object.entries(fields).map(([fieldName, { runtimeMeta, formMeta, value }]) => (
        <ListItem key={fieldName} disablePadding sx={{ display: 'block', mb: 2 }}>
          <Paper variant="outlined" sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" color="primary">{fieldName}</Typography>
              <Chip
                label={runtimeMeta?.isVisible !== false ? "Visible" : "Hidden"}
                size="small"
                color={runtimeMeta?.isVisible !== false ? "success" : "default"}
                variant="outlined"
              />
            </Box>
            {runtimeMeta?.isRequired && (
              <Chip label="Required" size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
            )}
            {runtimeMeta?.isDisabled && (
              <Chip label="Disabled" size="small" color="default" sx={{ mr: 0.5, mb: 0.5 }} />
            )}

            <Box sx={{ mt: 1, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                Value: {JSON.stringify(value)}
              </Typography>
            </Box>
            {formMeta?.errors && formMeta.errors.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {formMeta.errors.map((err: any, i: number) => (
                  <Typography key={i} variant="caption" color="error" display="block">
                    {err}
                  </Typography>
                ))}
              </Box>
            )}
            {runtimeMeta?.error && (
              <Typography variant="caption" color="error" display="block">
                Runtime Error: {runtimeMeta.error}
              </Typography>
            )}
          </Paper>
        </ListItem>
      ))}
    </List>
  );
};

const StateView = () => {
  const runtime = useRuntime();
  const [state, setState] = useState<any>({});

  useEffect(() => {
    const update = () => {
      setState(runtime.getForm().state);
    };
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, [runtime]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>Form State</Typography>
      <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.default', overflow: 'auto' }}>
        <pre style={{ margin: 0, fontSize: '0.8rem' }}>
          {JSON.stringify({
            isValid: state.isValid,
            isSubmitting: state.isSubmitting,
            isSubmitted: state.isSubmitted,
            isDirty: state.isDirty,
            isValidating: state.isValidating,
            values: state.values,
            errors: state.errors,
          }, null, 2)}
        </pre>
      </Paper>
    </Box>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export const DevTools = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const runtime = useRuntime();
  const traces = useRuntimeTraces(500); // Polling traces every 500ms

  const handleClearTraces = () => {
    runtime.clearTraces();
  };

  const handleRefresh = () => {
    runtime.invalidateAndRefresh();
  };

  return (
    <>
      <Tooltip title="Open SchemaForm DevTools">
        <Fab
          color="primary"
          size="small"
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 9999,
          }}
          onClick={() => setOpen(true)}
        >
          <BugIcon />
        </Fab>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 400, maxWidth: "90vw" },
        }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Typography variant="h6">DevTools</Typography>
            <IconButton onClick={() => setOpen(false)} color="inherit" size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Toolbar */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider", display: 'flex', gap: 1 }}>
            <Tooltip title="Force Re-evaluation">
              <IconButton onClick={handleRefresh} size="small" color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Traces">
              <IconButton onClick={handleClearTraces} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }} />
            <Chip label={`Traces: ${traces.length}`} size="small" />
          </Box>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<HistoryIcon />} label="Traces" />
            <Tab icon={<ListIcon />} label="Fields" />
            <Tab icon={<DataIcon />} label="State" />
          </Tabs>

          {/* Content */}
          <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
            <TabPanel value={tab} index={0}>
              {traces.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                  No traces yet. Interact with the form to see effects.
                </Typography>
              ) : (
                [...traces].reverse().map((trace, i) => (
                  <TraceItem key={i} trace={trace} />
                ))
              )}
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <FieldsView />
            </TabPanel>
            <TabPanel value={tab} index={2}>
              <StateView />
            </TabPanel>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default DevTools;
