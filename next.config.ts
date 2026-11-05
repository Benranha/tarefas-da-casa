import type { NextConfig } from "next";

// Apresentação do app em PDF (public/tarefinha-apresentacao.pdf), aberta em /conheca.
const APRESENTACAO = "/tarefinha-apresentacao.pdf";

const nextConfig: NextConfig = {
  async redirects() {
    // "/conheça" com cedilha chega codificado; manda para o endereço sem acento.
    return [{ source: "/conhe%C3%A7a", destination: "/conheca", permanent: true }];
  },
  async rewrites() {
    // Mantém o endereço /conheca na barra e entrega o PDF estático.
    return [{ source: "/conheca", destination: APRESENTACAO }];
  },
  async headers() {
    const pdf = [
      { key: "Content-Type", value: "application/pdf" },
      // inline: abre no visualizador do navegador; o nome vale para quem baixar.
      { key: "Content-Disposition", value: 'inline; filename="Tarefinha-apresentacao.pdf"' },
    ];
    return [
      { source: "/conheca", headers: pdf },
      { source: APRESENTACAO, headers: pdf },
    ];
  },
};

export default nextConfig;
