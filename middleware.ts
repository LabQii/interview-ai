import { NextRequest, NextResponse } from "next/server";

// Paths that anyone can access without a userId cookie
const PUBLIC_PATHS = [
    "/",
    "/api/timer",
    "/api/auto-submit",
    "/api/public",
    "/api/admin/auth",
    "/api/interview/cloudinary-signature",
    "/hrd/login",
    "/favicon.ico",
];

// Paths that require HRD token
const HRD_PATHS = ["/hrd"];

// Paths that require Admin token
const ADMIN_PATHS = ["/admin/dashboard", "/admin/questions", "/admin/interview-questions", "/admin/codes", "/admin/participants"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow Next.js internals and static files
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/fonts") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Allow public paths
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next();
    }

    // HRD dashboard — requires hrd_token cookie
    if (HRD_PATHS.some((p) => pathname.startsWith(p))) {
        const hrdToken = req.cookies.get("hrd_token")?.value;
        if (!hrdToken || hrdToken !== process.env.HRD_SECRET_KEY) {
            return NextResponse.redirect(new URL("/hrd/login", req.url));
        }
        return NextResponse.next();
    }

    // Admin dashboard — requires admin_token cookie
    if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
        const adminToken = req.cookies.get("admin_token")?.value;
        const validToken = process.env.ADMIN_USER + ":" + process.env.ADMIN_PASS;
        if (!adminToken || adminToken !== validToken) {
            return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.next();
    }

    // All other protected routes — just need a userId cookie
    // Fine-grained DB checks (test submitted, rules agreed, etc.) are done
    // inside each Server Component via getCurrentSession()
    const userId = req.cookies.get("userId")?.value;
    if (!userId) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
