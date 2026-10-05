import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Njangi Manager",
    short_name: "Njangi",
    description: "Record njangi contributions, payouts, fines, and the group fund.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#065f46",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],  
  };
}