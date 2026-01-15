export default function Loading() {
    return (
        <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-purple-600 animate-spin flex items-center justify-center shadow-lg shadow-primary/20">
                    <div className="h-4 w-4 bg-app rounded-md" />
                </div>
                <p className="text-sm font-medium text-text-muted animate-pulse">Establishing Secure Connection...</p>
            </div>
        </div>
    );
}
