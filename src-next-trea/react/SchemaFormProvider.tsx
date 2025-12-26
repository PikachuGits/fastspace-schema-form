import React, { createContext, useContext } from 'react';
import type { FormRuntime } from '../core/runtime/Runtime';

const SchemaFormContext = createContext<{ runtime: FormRuntime } | null>(null);

export const SchemaFormProvider: React.FC<{ runtime: FormRuntime; children: React.ReactNode }> = ({
    runtime,
    children,
}) => {
    return (
        <SchemaFormContext.Provider value={{ runtime }}>
            {children}
        </SchemaFormContext.Provider>
    );
};

export const useRuntime = () => {
    const context = useContext(SchemaFormContext);
    if (!context) {
        throw new Error('useRuntime must be used within a SchemaFormProvider');
    }
    return context.runtime;
};
