import { useState, useEffect } from 'react';
import { CUSTOMER_COLUMNS } from '@/lib/constants';

const STORAGE_KEY = 'customer_table_columns';

export function useCustomerSettings() {
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
                setVisibleColumns(CUSTOMER_COLUMNS.slice(0, 4).map(c => c.id));
            }
        } else {
            // Default to first 4 columns
            setVisibleColumns(CUSTOMER_COLUMNS.slice(0, 4).map(c => c.id));
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
