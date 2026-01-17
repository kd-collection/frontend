"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle, Trash2, Info } from "lucide-react";
import { useEffect } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

const variantConfig = {
    danger: {
        icon: Trash2,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
        buttonBg: "bg-red-500 hover:bg-red-600",
        buttonRing: "focus:ring-red-500/50",
    },
    warning: {
        icon: AlertTriangle,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-500",
        buttonBg: "bg-amber-500 hover:bg-amber-600",
        buttonRing: "focus:ring-amber-500/50",
    },
    info: {
        icon: Info,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
        buttonBg: "bg-blue-500 hover:bg-blue-600",
        buttonRing: "focus:ring-blue-500/50",
    },
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false,
}: ConfirmModalProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    // Prevent background scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isLoading) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={!isLoading ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-card border border-border-subtle rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header with close button */}
                            <div className="flex items-center justify-end px-4 pt-4">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="p-1.5 rounded-lg hover:bg-bg-surface transition-colors disabled:opacity-50"
                                >
                                    <X className="h-4 w-4 text-text-muted" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-6 pt-2 text-center">
                                {/* Icon */}
                                <div className={`mx-auto w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
                                    <Icon className={`h-7 w-7 ${config.iconColor}`} />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-text-main mb-2">
                                    {title}
                                </h3>

                                {/* Message */}
                                <p className="text-sm text-text-muted leading-relaxed">
                                    {message}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-border-subtle text-text-muted font-medium hover:bg-bg-surface transition-all disabled:opacity-50"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onConfirm}
                                        disabled={isLoading}
                                        className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${config.buttonBg} focus:outline-none focus:ring-2 ${config.buttonRing}`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            confirmText
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
