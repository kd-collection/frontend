"use client";

import { useState } from "react";
import { Settings as SettingsIcon, LayoutList, Eye, X, Plus, FileText, Users } from "lucide-react";
import { useContractSettings } from "@/hooks/useContractSettings";
import { useCustomerSettings } from "@/hooks/useCustomerSettings";
import { CONTRACT_COLUMNS, CUSTOMER_COLUMNS } from "@/lib/constants";
import { cn, formatIDR } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { motion } from "framer-motion";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'contracts' | 'customers'>('contracts');

    // Hooks
    const contractSettings = useContractSettings();
    const customerSettings = useCustomerSettings();

    // Determine active settings context
    const isContracts = activeTab === 'contracts';
    const settings = isContracts ? contractSettings : customerSettings;
    const allColumns = isContracts ? CONTRACT_COLUMNS : CUSTOMER_COLUMNS;

    // Dummy Data
    const contractPreview = {
        contract_no: "CTR-2026-PREVIEW",
        customer_info: { name: "John Doe", due: "2026-02-15" },
        balance: { outstanding: 5000000, arrears: 0 },
        handler: "Agent P",
        status: "On Track",
        loan_amount: 15000000,
        tenor: 12,
        va_account: "888801928392",
        area: "Jakarta Selatan",
        due_date: "15th",
        disbursement_date: "2025-02-15"
    };

    const customerPreview = {
        name: { name: "Sarah Smith", email: "sarah@example.com" },
        nik: "3171234567890001",
        phone: "+62 812-3456-7890",
        address: "Jl. Sudirman No. 1, Jakarta",
        company: "PT Maju Mundur",
        emergency: "Jane Doe (Sister)"
    };

    if (!settings.mounted) return null;

    const { visibleColumns, toggleColumn, isLimitReached } = settings;

    // Grid definition
    const gridTemplateColumns = [
        isContracts ? "60px" : "40px", // Checkbox/Row #
        ...allColumns.filter(c => visibleColumns.includes(c.id)).map(c => c.width),
        isContracts ? "50px" : "80px" // Action
    ].join(" ");

    const availableColumns = allColumns.filter(c => !visibleColumns.includes(c.id));

    return (
        <div className="space-y-8 pb-32">
            {/* Header */}
            <div className="space-y-1">
                <Breadcrumbs />
                <h1 className="text-2xl font-bold text-text-main tracking-tight">Settings</h1>
                <p className="text-sm text-text-muted">Customize your workspace and table preferences.</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-card border border-border-subtle rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('contracts')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === 'contracts'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-text-muted hover:text-text-main hover:bg-bg-app"
                    )}
                >
                    <FileText className="h-4 w-4" />
                    Contracts
                </button>
                <button
                    onClick={() => setActiveTab('customers')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === 'customers'
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-text-muted hover:text-text-main hover:bg-bg-app"
                    )}
                >
                    <Users className="h-4 w-4" />
                    Customers
                </button>
            </div>

            {/* Slot Builder UI */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <LayoutList className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-text-main">{isContracts ? 'Contract Columns' : 'Customer Columns'}</h2>
                        <p className="text-xs text-text-muted">Choose up to 5 columns to display in the {activeTab} table.</p>
                    </div>
                </div>

                {/* Main Builder Container */}
                <div className="bg-card border border-border-subtle rounded-xl p-6 space-y-8 shadow-sm">
                    {/* Top: Active Slots */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                            Active Slots ({visibleColumns.length}/5)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Array.from({ length: 5 }).map((_, i) => {
                                const columnId = visibleColumns[i];
                                const column = allColumns.find(c => c.id === columnId);
                                const isFilled = !!column;

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => isFilled && toggleColumn(columnId)}
                                        disabled={!isFilled}
                                        className={cn(
                                            "relative h-14 rounded-lg flex items-center justify-center border-2 border-dashed transition-all duration-200 group w-full",
                                            isFilled
                                                ? "bg-bg-app border-primary/30 cursor-pointer hover:border-destructive/50 hover:bg-destructive/10"
                                                : "bg-bg-app/30 border-border-subtle cursor-default"
                                        )}
                                        aria-label={isFilled ? `Remove ${column.label} column` : "Empty slot"}
                                    >
                                        {isFilled ? (
                                            <div className="flex items-center gap-2 px-3 w-full justify-between">
                                                <span className="text-sm font-semibold text-text-main group-hover:text-destructive transition-colors line-clamp-1">
                                                    {column.label}
                                                </span>
                                                <X className="h-3.5 w-3.5 text-text-muted group-hover:text-destructive transition-colors shrink-0" />
                                            </div>
                                        ) : (
                                            <span className="text-xs font-medium text-text-muted/40">Empty Slot</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border-subtle w-full" />

                    {/* Bottom: Available Options */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                            Available Columns
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {availableColumns.map((column) => (
                                <button
                                    key={column.id}
                                    onClick={() => !isLimitReached && toggleColumn(column.id)}
                                    disabled={isLimitReached}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all duration-200",
                                        isLimitReached
                                            ? "opacity-50 cursor-not-allowed bg-bg-app border-border-subtle text-text-muted"
                                            : "bg-card border-border-subtle text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 shadow-sm"
                                    )}
                                >
                                    <Plus className="h-3 w-3" />
                                    {column.label}
                                </button>
                            ))}
                            {availableColumns.length === 0 && (
                                <span className="text-xs text-text-muted italic">All columns selected</span>
                            )}
                        </div>
                        {isLimitReached && availableColumns.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium animate-in fade-in">
                                Slots full. Remove a column from above to add a new one.
                            </p>
                        )}
                    </div>
                </div>

                {/* Live Preview */}
                <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Live Preview
                        </h3>
                        <span className="text-xs text-text-muted bg-bg-app px-2 py-1 rounded border border-border-subtle">
                            Actual Table View
                        </span>
                    </div>

                    <div className="rounded-xl border border-border-subtle bg-card overflow-x-auto shadow-sm custom-scrollbar min-w-[300px]">
                        {/* Header */}
                        <div
                            className="grid gap-4 px-6 py-3 border-b border-border-subtle bg-bg-app/50 text-xs font-bold text-text-muted uppercase tracking-wider"
                            style={{ gridTemplateColumns }}
                        >
                            <div className="flex items-center gap-2"><span>#</span></div>

                            {/* Contracts Headers */}
                            {isContracts && visibleColumns.includes('contract_no') && <div>Contract No</div>}
                            {isContracts && visibleColumns.includes('customer_info') && <div>Customer Info</div>}
                            {isContracts && visibleColumns.includes('balance') && <div className="text-right">Balance</div>}
                            {isContracts && visibleColumns.includes('handler') && <div>Handler</div>}
                            {isContracts && visibleColumns.includes('status') && <div className="text-center">Status</div>}
                            {isContracts && visibleColumns.includes('loan_amount') && <div className="text-right">Loan Amount</div>}
                            {isContracts && visibleColumns.includes('tenor') && <div className="text-center">Tenor</div>}
                            {isContracts && visibleColumns.includes('va_account') && <div className="font-mono">VA Account</div>}
                            {isContracts && visibleColumns.includes('area') && <div>Area</div>}
                            {isContracts && visibleColumns.includes('due_date') && <div>Due Date</div>}
                            {isContracts && visibleColumns.includes('disbursement_date') && <div>Disburse Date</div>}

                            {/* Customers Headers */}
                            {!isContracts && visibleColumns.includes('name') && <div>Name</div>}
                            {!isContracts && visibleColumns.includes('nik') && <div>NIK</div>}
                            {!isContracts && visibleColumns.includes('phone') && <div>Phone</div>}
                            {!isContracts && visibleColumns.includes('address') && <div>Address</div>}
                            {!isContracts && visibleColumns.includes('company') && <div>Company</div>}
                            {!isContracts && visibleColumns.includes('emergency') && <div>Emergency</div>}

                            <div className="text-center">Action</div>
                        </div>

                        {/* Row */}
                        <div className="bg-card px-6 py-4">
                            <div
                                className="grid gap-4 items-center"
                                style={{ gridTemplateColumns }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded border border-text-muted/30" />
                                    <span className="text-xs font-mono text-text-muted">1</span>
                                </div>

                                {/* Contracts Data */}
                                {isContracts && visibleColumns.includes('contract_no') && (
                                    <div className="font-mono text-xs text-text-muted font-medium">{contractPreview.contract_no}</div>
                                )}
                                {isContracts && visibleColumns.includes('customer_info') && (
                                    <div>
                                        <p className="font-semibold text-text-main text-sm">{contractPreview.customer_info.name}</p>
                                        <p className="text-[11px] text-text-muted mt-0.5">Due: {new Date(contractPreview.customer_info.due).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {isContracts && visibleColumns.includes('balance') && (
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-text-main">{formatIDR(contractPreview.balance.outstanding)}</p>
                                    </div>
                                )}
                                {isContracts && visibleColumns.includes('handler') && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[10px] font-bold text-primary flex items-center justify-center uppercase border border-primary-subtle">
                                            {contractPreview.handler.charAt(0)}
                                        </div>
                                        <span className="text-xs text-text-muted">{contractPreview.handler}</span>
                                    </div>
                                )}
                                {isContracts && visibleColumns.includes('status') && (
                                    <div className="flex justify-center">
                                        <Badge variant="success" className="min-w-[90px] justify-center">On Track</Badge>
                                    </div>
                                )}
                                {isContracts && visibleColumns.includes('loan_amount') && (
                                    <div className="text-right text-sm text-text-main">{formatIDR(contractPreview.loan_amount)}</div>
                                )}
                                {isContracts && visibleColumns.includes('tenor') && (
                                    <div className="text-center text-sm text-text-muted">{contractPreview.tenor} Months</div>
                                )}
                                {isContracts && visibleColumns.includes('va_account') && (
                                    <div className="font-mono text-xs text-text-muted">{contractPreview.va_account}</div>
                                )}
                                {isContracts && visibleColumns.includes('area') && (
                                    <div className="text-sm text-text-muted">{contractPreview.area}</div>
                                )}
                                {isContracts && visibleColumns.includes('due_date') && (
                                    <div className="text-sm text-text-muted">{contractPreview.due_date} of month</div>
                                )}
                                {isContracts && visibleColumns.includes('disbursement_date') && (
                                    <div className="text-sm text-text-muted">{contractPreview.disbursement_date}</div>
                                )}


                                {/* Customers Data */}
                                {!isContracts && visibleColumns.includes('name') && (
                                    <div>
                                        <p className="font-semibold text-text-main text-sm">{customerPreview.name.name}</p>
                                        <p className="text-[11px] text-text-muted">{customerPreview.name.email}</p>
                                    </div>
                                )}
                                {!isContracts && visibleColumns.includes('nik') && (
                                    <div className="text-xs font-mono text-text-muted">{customerPreview.nik}</div>
                                )}
                                {!isContracts && visibleColumns.includes('phone') && (
                                    <div className="text-xs text-text-muted">{customerPreview.phone}</div>
                                )}
                                {!isContracts && visibleColumns.includes('address') && (
                                    <div className="text-xs text-text-muted truncate">{customerPreview.address}</div>
                                )}
                                {!isContracts && visibleColumns.includes('company') && (
                                    <div className="text-xs text-text-muted">{customerPreview.company}</div>
                                )}
                                {!isContracts && visibleColumns.includes('emergency') && (
                                    <div className="text-xs text-text-muted">{customerPreview.emergency}</div>
                                )}

                                <div className="flex justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-text-muted/50" />
                                    <div className="h-1.5 w-1.5 rounded-full bg-text-muted/50 mx-0.5" />
                                    <div className="h-1.5 w-1.5 rounded-full bg-text-muted/50" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
