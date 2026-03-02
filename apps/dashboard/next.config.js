/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        "@eventos-prime/ui",
        "@eventos-prime/db",
        "@eventos-prime/types",
    ],
};

module.exports = nextConfig;
