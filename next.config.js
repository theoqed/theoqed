/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Mengabaikan error pengecekan tipe saat proses build production di Netlify
    ignoreBuildErrors: true,
  },
  eslint: {
    // Mengabaikan error linting jika ada
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;