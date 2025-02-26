/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Only apply polyfills in the browser build
    if (!isServer) {
      // Point 'node:' imports to polyfills or empty objects
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:process': 'process/browser',
        'node:crypto': 'crypto-browserify',
        'node:stream': 'stream-browserify',
        'node:util': 'util',
        'node:buffer': 'buffer',
      };
      
      // Provide process and Buffer globally
      config.plugins.push(
        new webpack.ProvidePlugin({
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
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util'),
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
      };
    }

    return config;
  },
  // Explicitly mark certain packages as server-only
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  // Avoid showing Firebase Admin errors in browser
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;