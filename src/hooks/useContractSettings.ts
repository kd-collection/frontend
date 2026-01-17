import { useState, useEffect } from 'react';
import { CONTRACT_COLUMNS } from '@/lib/constants';

const STORAGE_KEY = 'contract_table_columns';

export function useContractSettings() {
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setVisibleColumns(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse settings", e);
                setVisibleColumns(CONTRACT_COLUMNS.slice(0, 5).map(c => c.id));
            }
        } else {
            // Default to first 5 columns
            setVisibleColumns(CONTRACT_COLUMNS.slice(0, 5).map(c => c.id));
        }
    }, []);

    const toggleColumn = (columnId: string) => {
        setVisibleColumns(prev => {
            let newColumns;
            if (prev.includes(columnId)) {
                newColumns = prev.filter(id => id !== columnId);
            } else {
                if (prev.length >= 5) return prev;
                newColumns = [...prev, columnId];
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
            return newColumns;
        });
    };

    return {
        visibleColumns,
        toggleColumn,
        mounted,
        isLimitReached: visibleColumns.length >= 5
    };
}
