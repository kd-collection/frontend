import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatIDR(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatPhoneNumber(phone?: string | null): string {
    if (!phone) return "-";

    // Clean all non-numeric chars
    let cleaned = phone.replace(/\D/g, '');

    // Handle empty or invalid
    if (cleaned.length < 5) return phone; // Return original if too short/weird

    // Normalize prefix: 08xx -> 628xx
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    }

    // Ensure it starts with 62 now
    if (!cleaned.startsWith('62')) {
        // If it doesn't start with 62 (and didn't start with 0), assume it's a number without country code? 
        // Or specific local case. For now, let's just prepend 62 if it looks like a local mobile (starts with 8)
        if (cleaned.startsWith('8')) {
            cleaned = '62' + cleaned;
        }
    }

    // Now format: +62 8xx-xxxx-xxxx
    // Expected structure: 62 (Country) + 8xx (Prefix) + xxxx (Middle) + xxxx (End)

    // Check if it's a standard ID mobile number (usually 11-13 digits including 62)
    // 62 812 3456 7890 (13 digits) -> +62 812-3456-7890
    // 62 812 3456 789 (12 digits) -> +62 812-3456-789
    // 62 813 1052 2546 (13 digits user example)

    if (cleaned.startsWith('62')) {
        const trunk = cleaned.slice(2); // Remove 62
        let formattedTrunk = "";

        if (trunk.length >= 10) {
            // Example: 81310522546 (11 digits)
            // 813-1052-2546
            formattedTrunk = `${trunk.slice(0, 3)}-${trunk.slice(3, 7)}-${trunk.slice(7)}`;
        } else if (trunk.length >= 6) {
            // Fallback for shorter numbers
            formattedTrunk = `${trunk.slice(0, 3)}-${trunk.slice(3)}`;
        } else {
            formattedTrunk = trunk;
        }

        return `+62 ${formattedTrunk}`;
    }

    return phone; // Fallback
}
