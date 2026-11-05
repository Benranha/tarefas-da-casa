import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // "/conheça" com cedilha chega codificado; manda para a página sem acento.
    return [
      { source: "/conhe%C3%A7a", destination: "/conheca", permanent: true },
      // O acesso agora é só com o Google: links antigos de senha e de confirmação de e-mail vão para o login.
      ...["/esqueci-senha", "/redefinir-senha", "/verificar-email"].map((source) => ({
        source,
        destination: "/login",
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
