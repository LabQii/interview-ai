/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: "standalone", // Disabled for Nixpacks to retain the workers/ folder
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
};

export default nextConfig;
