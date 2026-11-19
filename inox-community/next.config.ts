import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le immagini arrivano già ridimensionate dal client e sono servite da R2:
  // niente ottimizzazione lato Vercel, che avrebbe un costo per immagine.
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
