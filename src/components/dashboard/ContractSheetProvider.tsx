"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import ContractDetailSheet from "@/components/ui/ContractDetailSheet";
import { Contract } from "@/lib/api";

interface ContractSheetContextType {
    openDetail: (contract: Contract) => void;
}

const ContractSheetContext = createContext<ContractSheetContextType | null>(null);

export function useContractSheet() {
    const context = useContext(ContractSheetContext);
    if (!context) {
        throw new Error("useContractSheet must be used within a ContractSheetProvider");
    }
    return context;
}

export function ContractSheetProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const openDetail = (contract: Contract) => {
        setSelectedContract(contract);
        setIsDetailOpen(true);
    };

    return (
        <ContractSheetContext.Provider value={{ openDetail }}>
            {children}
            <ContractDetailSheet
                contract={selectedContract}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onEdit={() => {
                    setIsDetailOpen(false);
                    router.push('/contracts');
                }}
            />
        </ContractSheetContext.Provider>
    );
}
