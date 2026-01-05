import { useEffect, useState } from "react";
import { useRuntime } from "./SchemaFormProvider";

export function useRuntimeTraces(interval = 300) {
    const runtime = useRuntime();
    const [traces, setTraces] = useState(() => [...runtime.getTraces()]);

    useEffect(() => {
        const id = setInterval(() => {
            // Create a shallow copy to trigger re-render
            setTraces([...runtime.getTraces()]);
        }, interval);
        return () => clearInterval(id);
    }, [runtime, interval]);

    return traces;
}