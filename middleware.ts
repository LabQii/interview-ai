import { NextRequest, NextResponse } from "next/server";

// Paths that anyone can access without a userId cookie
const PUBLIC_PATHS = [
    "/",
    "/api/timer",
    "/api/auto-submit",
    "/api/public",
    "/api/interview/cloudinary-signature",
    "/favicon.ico",
];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow Next.js internals and static files
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/fonts") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Admin routing
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        const isAuthApi = pathname === "/api/admin/auth";
        if (isAuthApi) {
            return NextResponse.next();
        }

        const adminToken = req.cookies.get("admin_token")?.value;
        const isLoginPage = pathname === "/admin/login";

        // If trying to access login page while already authenticated
        if (isLoginPage && adminToken) {
            try {
                const { jwtVerify } = await import("jose");
                const secret = new TextEncoder().encode(
                    process.env.ADMIN_SECRET || "default_admin_secret_key"
                );
                await jwtVerify(adminToken, secret);
                // Valid token, redirect to dashboard
                return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            } catch (error) {
                // Invalid token will be cleared later or ignored here
            }
        }

        // Allow access to login page
        if (isLoginPage) {
            return NextResponse.next();
        }

        // For all other /admin/* routes, require valid token
        if (!adminToken) {
            if (pathname.startsWith("/api/admin")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }

        try {
            const { jwtVerify } = await import("jose");
            const secret = new TextEncoder().encode(
                process.env.ADMIN_SECRET || "default_admin_secret_key"
            );
            await jwtVerify(adminToken, secret);

            // If they access exactly `/admin`, redirect to dashboard
            if (pathname === "/admin") {
                return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }
        } catch (error) {
            console.error("Invalid admin token:", error);
            const response = pathname.startsWith("/api/admin")
                ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
                : NextResponse.redirect(new URL("/admin/login", req.url));
            response.cookies.delete("admin_token");
            return response;
        }

        return NextResponse.next();
    }

    // HRD routing
    if (pathname.startsWith("/hrd")) {
        if (pathname === "/hrd/login") {
            return NextResponse.next();
        }
        const hrdToken = req.cookies.get("hrd_token")?.value;
        if (!hrdToken || hrdToken !== process.env.HRD_SECRET_KEY) {
            return NextResponse.redirect(new URL("/hrd/login", req.url));
        }
        return NextResponse.next();
    }

    // Allow public paths (Candidate side config)
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
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
