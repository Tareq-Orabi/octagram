export default {
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
  webpack(config) {
    config.module.rules.push({
      test: /machine-loop(?:-mobile)?\.mp4$/,
      type: "asset/resource",
      generator: { filename: "static/media/[name].[contenthash:8][ext]" },
    });
    return config;
  },
};
