/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // @resvg/resvg-js ships a native .node binary — keep it out of the webpack bundle.
  experimental: { serverComponentsExternalPackages: ["@resvg/resvg-js"] },
};
