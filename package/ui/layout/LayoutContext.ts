import React, { createContext, useContext } from 'react';
import type { LayoutNode } from '../../types';

export interface LayoutContextType {
    renderField: (fieldPath: string, layoutChildren?: LayoutNode[]) => React.ReactNode;
}

export const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayoutContext = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayoutContext must be used within a LayoutRenderer');
    }
    return context;
};
