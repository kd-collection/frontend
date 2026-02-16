import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_URL = process.env.TELEPHONY_SERVICE_URL || "http://localhost:4000";
const API_KEY = process.env.NEXT_PUBLIC_TELEPHONY_KEY || "";

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
    const { path } = await params;
    const pathString = path.join("/");
    const url = `${UPSTREAM_URL}/${pathString}`;

    try {
        const body = req.method !== "GET" && req.method !== "DELETE" ? await req.json() : undefined;

        const response = await fetch(url, {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        // Handle empty responses (like 204)
        const data = response.status === 204 ? {} : await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || `Upstream Error: ${response.statusText}` },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || "Internal Proxy Error" },
            { status: 500 }
        );
    }
}

export { handler as GET, handler as POST, handler as DELETE, handler as PUT, handler as PATCH };
