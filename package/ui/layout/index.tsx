import React from 'react';
import { Grid, Stack, Paper, Card, CardContent, Typography } from '@mui/material';
import type { LayoutNode } from '../../types';
import { LayoutContext } from './LayoutContext';

export interface LayoutRendererProps {
    layout: LayoutNode[];
    renderField: (fieldPath: string, layoutChildren?: LayoutNode[]) => React.ReactNode;
}

export const LayoutRenderer: React.FC<LayoutRendererProps> = ({ layout, renderField }) => {
    return (
        <LayoutContext.Provider value={{ renderField }}>
            {layout.map((node, index) => (
                <LayoutNodeRenderer key={index} node={node} renderField={renderField} />
            ))}
        </LayoutContext.Provider>
    );
};

const LayoutNodeRenderer: React.FC<{ node: LayoutNode; renderField: (path: string, layoutChildren?: LayoutNode[]) => React.ReactNode }> = ({ node, renderField }) => {
    if (node.type === 'field') {
        if (!node.field) return null;

        const fieldContent = renderField(node.field, node.children);

        return <>{fieldContent}</>;
    }

    // Container
    const { component, props, children } = node;

    const renderedChildren = children ? (
        <LayoutRenderer layout={children} renderField={renderField} />
    ) : null;

    switch (component) {
        case 'Grid':
            return (
                <Grid container spacing={2} {...props}>
                    {children?.map((child, idx) => (
                        <Grid key={idx} size={child.props?.gridItem || 12}>
                            <LayoutNodeRenderer node={child} renderField={renderField} />
                        </Grid>
                    ))}
                </Grid>
            );
        case 'Stack':
            return (
                <Stack spacing={2} {...props}>
                    {renderedChildren}
                </Stack>
            );
        case 'Card':
            return (
                <Card {...props}>
                    <CardContent>
                        {props?.title && <Typography variant="h6" gutterBottom>{props.title}</Typography>}
                        {renderedChildren}
                    </CardContent>
                </Card>
            );
        case 'Group':
            return (
                <Paper variant="outlined" sx={{ p: 2 }} {...props}>
                    {props?.title && <Typography variant="subtitle1" gutterBottom>{props.title}</Typography>}
                    {renderedChildren}
                </Paper>
            );
        default:
            return <div {...props}>{renderedChildren}</div>;
    }
};
