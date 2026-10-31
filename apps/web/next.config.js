/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  transpilePackages: ['@reina/*'],
  webpack: (config, { isServer, dev }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true, layers: true };
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    });
    config.module.rules.push({
      test: /\.(gltf|glb|obj|stl|ply|fbx|dae|usdz|3mf)$/,
      type: 'asset/resource',
    });
    // Add path aliases for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@reina/core/types': require('path').resolve(__dirname, '../../packages/core/types'),
      '@reina/core/math': require('path').resolve(__dirname, '../../packages/core/math'),
      '@reina/core/schema': require('path').resolve(__dirname, '../../packages/core/schema'),
      '@reina/ml': require('path').resolve(__dirname, '../../packages/ml-core'),
      '@reina/physics': require('path').resolve(__dirname, '../../packages/physics-core'),
      '@reina/shaders': require('path').resolve(__dirname, '../../packages/shaders'),
    };
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    }
    return config;
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;