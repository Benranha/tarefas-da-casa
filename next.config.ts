import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // "/conheça" com cedilha chega codificado; manda para a página sem acento.
    return [{ source: "/conhe%C3%A7a", destination: "/conheca", permanent: true }];
  },
};

export default nextConfig;
