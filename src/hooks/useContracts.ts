import { useQuery } from "@tanstack/react-query";
import { api, Contract } from "@/lib/api";

// Fallback Mock Data (Explicit separation)
const MOCK_CONTRACTS: Contract[] = [
    { nid: 1, ccontract_no: "CTR-2026-001", cname: "Budi Santoso", noutstanding: 5000000, narrears: 500000, darea_date: "2026-01-15", chandler: "Agent X" },
    { nid: 2, ccontract_no: "CTR-2026-002", cname: "Amanda Manopo", noutstanding: 12500000, narrears: 0, darea_date: "2026-01-20", chandler: "Agent Y" },
    { nid: 3, ccontract_no: "CTR-2026-003", cname: "Raffi Ahmad", noutstanding: 75000000, narrears: 12000000, darea_date: "2026-01-10", chandler: "Agent Z" },
];

export function useContracts() {
    return useQuery({
        queryKey: ["contracts"],
        queryFn: async () => {
            try {
                const response = await api.getContracts();
                if (response.success && response.data) {
                    return response.data;
                }
                throw new Error("Failed to fetch contracts");
            } catch (error) {
                console.warn("API Error, falling back to mock data (DEMO MODE)", error);
                // In a real app, we might want to throw here to show specific error UI.
                // For this demo context, we fallback to mock data as per previous behavior,
                // but now explicitly controlled.
                return MOCK_CONTRACTS;
            }
        },
        // Optional: Keep previous data while fetching new data
        placeholderData: (previousData) => previousData,
    });
}
