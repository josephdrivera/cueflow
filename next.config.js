/** @type {import('next').NextConfig} */
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Only apply polyfills in the browser build
    if (!isServer) {
      // Add Node.js polyfills
      config.plugins.push(new NodePolyfillPlugin());
      
      // Provide process and Buffer globally
      config.plugins.push(
        new (require('webpack')).ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Ensure node modules that should only run on server are not included in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'firebase-admin': false,
        'firebase-admin/app': false,
        'firebase-admin/auth': false,
        'firebase-admin/firestore': false,
        'firebase-admin/storage': false,
      };
    }

    return config;
  },
  // Explicitly mark certain packages as server-only
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

module.exports = nextConfig;
