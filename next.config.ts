import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Interim GitHub Pages hosting (§15.2 amended 2026-08-02): a project site
// serves under /<repo>/, so PAGES_BASE_PATH threads that prefix through the
// build (assets + links). Unset for root-serving hosts; removed entirely when
// the clinic domain is attached or the launch host takes over.
const pagesBasePath = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  // Fully static site — every locale × route pre-rendered, no server at runtime (brief §2.1).
  output: 'export',
  trailingSlash: true,
  ...(pagesBasePath ? { basePath: pagesBasePath } : {}),

  // next-image-export-optimizer (owner decision 2026-08-01, brief §15.5): the runtime
  // optimizer doesn't exist under static export, so images are pre-generated at build
  // time and served from srcset baked into the HTML (brief §11).
  images: {
    loader: 'custom',
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  transpilePackages: ['next-image-export-optimizer'],
  env: {
    nextImageExportOptimizer_imageFolderPath: 'public/images',
    nextImageExportOptimizer_exportFolderPath: 'out',
    nextImageExportOptimizer_quality: '75',
    nextImageExportOptimizer_storePicturesInWEBP: 'true',
    nextImageExportOptimizer_exportFolderName: 'nextImageExportOptimizer',
    nextImageExportOptimizer_generateAndUseBlurImages: 'true',
    nextImageExportOptimizer_remoteImageCacheTTL: '0',
  },
};

export default withNextIntl(nextConfig);
