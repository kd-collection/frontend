import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Contract } from "@/lib/api";

// Fallback Mock Data (Explicit separation)
let MOCK_CONTRACTS: Contract[] = [
    { nid: 1, ccontract_no: "CTR-2026-001", cname: "Budi Santoso", noutstanding: 5000000, narrears: 500000, darea_date: "2026-01-15", chandler: "Agent X" },
    { nid: 2, ccontract_no: "CTR-2026-002", cname: "Amanda Manopo", noutstanding: 12500000, narrears: 0, darea_date: "2026-01-20", chandler: "Agent Y" },
    { nid: 3, ccontract_no: "CTR-2026-003", cname: "Raffi Ahmad", noutstanding: 75000000, narrears: 12000000, darea_date: "2026-01-10", chandler: "Agent Z" },
];

export function useContracts(page: number = 1, limit: number = 10) {
    return useQuery({
        queryKey: ["contracts", page, limit],
        queryFn: async () => {
            try {
                const response = await api.getContracts({ page, limit });

                // Response contains { data: Contract[], pagination: ... }
                if (response && response.data) {
                    return response; // Return the full object so UI gets pagination too
                }

                throw new Error("Failed to fetch contracts");
            } catch (error) {
                if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
                    console.warn("API Error, falling back to mock data (DEMO MODE ACTIVE)", error);
                    return {
                        data: MOCK_CONTRACTS.slice((page - 1) * limit, page * limit),
                        pagination: {
                            page,
                            limit,
                            total: MOCK_CONTRACTS.length,
                            totalPages: Math.ceil(MOCK_CONTRACTS.length / limit)
                        }
                    };
                }
                // In production, we throw so UI can handle error state
                throw error;
            }
        },
        // Keep previous data while fetching new data to avoid flickering
        placeholderData: (previousData) => previousData,
    });
}

export function useDeleteContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (contractId: number) => {
            if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
                // Simulate delete in demo mode
                await new Promise(resolve => setTimeout(resolve, 800)); // Fake network delay
                MOCK_CONTRACTS = MOCK_CONTRACTS.filter(c => c.nid !== contractId);
                return { success: true, id: contractId };
            }

            const response = await api.deleteContract(contractId);
            if (!response.success) {
                throw new Error(response.message || "Failed to delete contract");
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
        }
    });
}
