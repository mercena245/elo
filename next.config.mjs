/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  
  // Otimizações de produção
  compiler: {
    // Remove console.log, console.info, console.debug em produção
    // Mantém console.error e console.warn para monitoramento
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Minificação agressiva
  swcMinify: true,
  
  // Otimizações adicionais
  productionBrowserSourceMaps: false, // Desativa source maps em produção
  poweredByHeader: false, // Remove header "X-Powered-By"
  
  // Performance
  compress: true, // Compressão Gzip
};

export default nextConfig;
