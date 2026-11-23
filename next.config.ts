import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // "/conheça" com cedilha chega codificado; manda para a página sem acento.
    return [{ source: "/conhe%C3%A7a", destination: "/conheca", permanent: true }];
  },
  async headers() {
    // A tela de permissão do conector do Claude não pode ser aberta dentro de outro site (clickjacking).
    const naoEmbutir = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
    ];
    return [
      { source: "/oauth/:path*", headers: naoEmbutir },
      { source: "/api/oauth/:path*", headers: naoEmbutir },
    ];
  },
};

export default nextConfig;
