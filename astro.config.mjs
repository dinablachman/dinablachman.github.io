// @ts-check
import { defineConfig } from 'astro/config';

// Custom domain via CNAME, so no `base` path is needed.
export default defineConfig({
  site: 'https://dinablachman.com',
  trailingSlash: 'ignore',
  // pages are tiny — fetch them on hover so the tab swap is instant on click
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
