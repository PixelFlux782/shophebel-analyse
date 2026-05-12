This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Rendered Analysis And Screenshots

The analysis API uses static HTML by default in production unless rendered mode is explicitly enabled. For screenshot previews set one of these environment variables:

```bash
SHOPHEBEL_RENDERED_ANALYSIS=true
# or
SHOPHEBEL_ANALYSIS_MODE=rendered
```

Rendered mode starts Puppeteer and calls `captureAnalysisScreenshots(...)` for `viewport`, `fullPage`, and `mobile`. Screenshot errors are logged server-side and do not abort the analysis. If the browser cannot start and static HTML is available, the API falls back to `analysisMode: "static"`.

Browser runtime:

- Local development uses the normal `puppeteer` package.
- Production/Vercel uses `puppeteer-core` with `@sparticuz/chromium`.
- `PUPPETEER_EXECUTABLE_PATH` overrides both strategies when a custom Chromium path is available.
- `.npmrc` sets `puppeteer_skip_download=true` so Vercel does not download an unnecessary bundled Chromium during install. If a fresh local install has no browser, run `npx puppeteer browsers install chrome`.

Screenshot storage:

- Development writes to `public/generated-screenshots`.
- Production writes to Supabase Storage. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_SCREENSHOT_BUCKET`.
- `SUPABASE_SCREENSHOT_PUBLIC_BASE_URL` can override the generated public URL base.

On Vercel Serverless, local screenshot files are not persistent. If Chromium cannot start, the API logs the browser reason, completes the static analysis when possible, stores `screenshots: null`, leaves `visualPreviewAvailable` false, and writes `metadata.screenshotError` plus `metadata.screenshotErrorSource` to Supabase.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
