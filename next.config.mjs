/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const repo = process.env.NEXT_PUBLIC_BASE_PATH ?? 'daily-zen-studio';
const basePath = isProd && repo ? `/${repo}` : '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_RESOLVED_BASE_PATH: basePath,
  },
};

export default nextConfig;
