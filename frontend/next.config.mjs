/** @type {import('next').NextConfig} */

// Pour l'app de bureau (Electron) on exporte un site statique servi par l'API :
//   NEXT_OUTPUT=export NEXT_PUBLIC_API_URL=/api next build  → dossier `out/`
// En développement normal (`next dev`), aucune de ces options n'est active.
const isExport = process.env.NEXT_OUTPUT === "export";

const nextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: "export",
        // L'optimiseur d'images de Next nécessite un serveur — désactivé en export.
        images: { unoptimized: true },
        // Liens internes en .html pour un service statique simple par Express.
        trailingSlash: false,
      }
    : {}),
};

export default nextConfig;
