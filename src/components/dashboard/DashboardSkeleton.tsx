export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-card rounded-md"></div>
                    <div className="h-4 w-48 bg-card rounded-md"></div>
                </div>
                <div className="flex gap-2.5 w-full md:w-auto">
                    <div className="h-10 w-24 bg-card border border-border-subtle rounded-lg"></div>
                    <div className="h-10 w-28 bg-primary/20 rounded-lg"></div>
                </div>
            </div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[120px] bg-card rounded-xl border border-border-subtle p-5 flex flex-col justify-between">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-border-subtle/50 rounded"></div>
                            <div className="h-8 w-8 bg-border-subtle/50 rounded-lg"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-8 w-32 bg-border-subtle/50 rounded"></div>
                            <div className="h-3 w-16 bg-border-subtle/50 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[400px] rounded-xl bg-card border border-border-subtle p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                                <div className="h-5 w-40 bg-border-subtle/50 rounded"></div>
                                <div className="h-3 w-32 bg-border-subtle/50 rounded"></div>
                            </div>
                            <div className="h-8 w-48 bg-border-subtle/50 rounded-md"></div>
                        </div>
                        <div className="h-[280px] w-full bg-border-subtle/30 rounded-lg"></div>
                    </div>
                    <div className="h-[300px] rounded-xl bg-card border border-border-subtle p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-5 w-40 bg-border-subtle/50 rounded"></div>
                            <div className="h-4 w-24 bg-border-subtle/50 rounded"></div>
                        </div>
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 w-full bg-border-subtle/30 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="h-full min-h-[724px] rounded-xl bg-card border border-border-subtle p-6">
                        <div className="h-5 w-32 bg-border-subtle/50 rounded mb-6"></div>
                        <div className="space-y-6 pl-4 border-l border-border-subtle/50 ml-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="space-y-2 relative">
                                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-border-subtle/50"></div>
                                    <div className="h-4 w-3/4 bg-border-subtle/50 rounded"></div>
                                    <div className="h-3 w-1/2 bg-border-subtle/50 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
