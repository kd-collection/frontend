"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px]",
                                t.type === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                                t.type === "error" && "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
                                t.type === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
                                t.type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
                                "bg-card/90" // Fallback / Base
                            )}
                        >
                            {t.type === "success" && <CheckCircle className="h-5 w-5" />}
                            {t.type === "error" && <AlertCircle className="h-5 w-5" />}
                            {t.type === "warning" && <AlertCircle className="h-5 w-5" />}
                            {t.type === "info" && <Info className="h-5 w-5" />}

                            <p className="text-sm font-medium flex-1">{t.message}</p>

                            <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100 transition-opacity">
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
