"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface ImportResult {
    total: number;
    imported: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
}

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && isValidFile(droppedFile)) {
            setFile(droppedFile);
            setResult(null);
            setError(null);
        } else {
            setError("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.");
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && isValidFile(selectedFile)) {
            setFile(selectedFile);
            setResult(null);
            setError(null);
        } else if (selectedFile) {
            setError("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.");
        }
    }, []);

    const isValidFile = (file: File): boolean => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['xlsx', 'xls', 'csv'].includes(ext || '');
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/import/contracts`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.message || 'Import failed');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
    };

    const downloadTemplate = () => {
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/import/template`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <Breadcrumbs />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main tracking-tight">Import Data</h1>
                        <p className="text-sm text-text-muted mt-0.5 font-medium">Upload Excel or CSV files to import contracts and customers.</p>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 rounded-lg bg-card border border-border-subtle text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download Template
                    </button>
                </div>
            </div>

            {/* Upload Area */}
            <div className="rounded-xl border border-border-subtle bg-card shadow-sm overflow-hidden">
                <div className="p-6">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 text-center",
                            isDragging
                                ? "border-primary bg-primary-subtle"
                                : "border-border-strong hover:border-primary/50 hover:bg-bg-card-hover",
                            file && "border-primary bg-primary-subtle"
                        )}
                    >
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div
                                    key="file-selected"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <FileSpreadsheet className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-text-main">{file.name}</p>
                                        <p className="text-sm text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                        className="text-sm text-text-muted hover:text-destructive transition-colors flex items-center gap-1"
                                    >
                                        <X className="h-4 w-4" />
                                        Remove file
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-file"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <div className="h-16 w-16 rounded-xl bg-bg-app flex items-center justify-center border border-border-subtle">
                                        <Upload className="h-8 w-8 text-text-muted" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-text-main">
                                            {isDragging ? "Drop your file here" : "Drag & drop your file here"}
                                        </p>
                                        <p className="text-sm text-text-muted mt-1">or click to browse • Supports .xlsx, .xls, .csv</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Upload Button */}
                    {file && !result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 flex justify-center"
                        >
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className={cn(
                                    "px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-2 transition-all shadow-md shadow-primary/20",
                                    isUploading ? "opacity-70 cursor-not-allowed" : "hover:bg-primary/90"
                                )}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Start Import
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 flex items-start gap-3"
                            >
                                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-destructive">Import Error</p>
                                    <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success Result */}
                    <AnimatePresence>
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-6 space-y-4"
                            >
                                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Import Complete!</p>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400/80">
                                            {result.imported} of {result.total} records imported successfully.
                                            {result.skipped > 0 && ` ${result.skipped} rows skipped.`}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 rounded-lg bg-bg-app border border-border-subtle text-center">
                                        <p className="text-2xl font-bold text-text-main">{result.total}</p>
                                        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Rows</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 text-center">
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.imported}</p>
                                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide font-medium">Imported</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 text-center">
                                        <p className="text-2xl font-bold text-destructive">{result.errors.length}</p>
                                        <p className="text-xs text-rose-600/70 dark:text-rose-400/70 uppercase tracking-wide font-medium">Errors</p>
                                    </div>
                                </div>

                                {/* Error Details */}
                                {result.errors.length > 0 && (
                                    <div className="p-4 rounded-lg bg-bg-app border border-border-subtle">
                                        <p className="text-sm font-semibold text-text-main mb-3">Error Details</p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {result.errors.map((err, i) => (
                                                <div key={i} className="text-xs flex gap-2">
                                                    <span className="font-mono text-text-muted">Row {err.row}:</span>
                                                    <span className="text-destructive">{err.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 rounded-lg bg-card border border-border-subtle text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-colors text-sm font-medium"
                                    >
                                        Import Another File
                                    </button>
                                    <a
                                        href="/contracts"
                                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                                    >
                                        View Contracts
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
