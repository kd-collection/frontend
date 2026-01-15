import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center space-y-4">
            <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FileQuestion className="h-10 w-10 text-text-muted" />
            </div>
            <h2 className="text-2xl font-bold text-white">404 | Page Not Found</h2>
            <p className="text-text-muted max-w-md">
                The requested resource could not be found via the secure gateway.
            </p>
            <Link
                href="/"
                className="mt-6 px-6 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    );
}
