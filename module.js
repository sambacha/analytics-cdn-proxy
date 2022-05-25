/**
 * @package
 * @author
 * @license
 * @version
 * @see
 */

const date = new Date();
const GIT_COMMIT_SHA_SHORT =
  typeof process.env.GIT_COMMIT_SHA === "string" &&
  process.env.GIT_COMMIT_SHA.substring(0, 8);
console.debug(
  `Building Next with NODE_ENV="${process.env.NODE_ENV}" NEXT_PUBLIC_APP_STAGE="${process.env.NEXT_PUBLIC_APP_STAGE}" for NEXT_PUBLIC_CUSTOMER_REF="${process.env.NEXT_PUBLIC_CUSTOMER_REF}" using GIT_COMMIT_SHA=${process.env.GIT_COMMIT_SHA} and GIT_COMMIT_REF=${process.env.GIT_COMMIT_REF}`
);

const GIT_COMMIT_TAGS = (
  process.env.GIT_COMMIT_TAGS ? process.env.GIT_COMMIT_TAGS.trim() : ""
).replace("refs/tags/", "");
console.debug(
  `Deployment will be tagged automatically, using GIT_COMMIT_TAGS: "${GIT_COMMIT_TAGS}"`
);

module.exports = {
  env: {
    // Most sensitive env variables
    GITHUB_DISPATCH_TOKEN: process.env.GITHUB_DISPATCH_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN, // Sentry DSN must be provided to the browser for error reporting to work there

    // Vercel env variables - See https://vercel.com/docs/environment-variables#system-environment-variables
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    CI: process.env.CI,

    // Dynamic env variables
    NEXT_PUBLIC_APP_DOMAIN: process.env.VERCEL_URL, // Alias
    NEXT_PUBLIC_APP_BASE_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:8888",
    NEXT_PUBLIC_APP_BUILD_TIME: date.toString(),
    NEXT_PUBLIC_APP_BUILD_TIMESTAMP: +date,
    NEXT_PUBLIC_APP_NAME: packageJson.name,
    NEXT_PUBLIC_APP_NAME_VERSION: `${packageJson.name}-${APP_RELEASE_TAG}`,
    GIT_COMMIT_SHA_SHORT,
    GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA, // Resolve commit hash from ENV first (set through CI), fallbacks to reading git (when used locally, through "/scripts/populate-git-env.sh")
    GIT_COMMIT_REF: process.env.GIT_COMMIT_REF, // Resolve commit ref (branch/tag) from ENV first (set through CI), fallbacks to reading git (when used locally, through "/scripts/populate-git-env.sh")
    GIT_COMMIT_TAGS: process.env.GIT_COMMIT_TAGS || "", // Resolve commit tags/releases from ENV first (set through CI), fallbacks to reading git (when used locally, through "/scripts/populate-git-env.sh")
  },
  /**
   * Headers allow you to set custom HTTP headers for an incoming request path.
   *
   * Headers allow you to set route specific headers like CORS headers, content-types, and any other headers that may be needed.
   * They are applied at the very top of the routes.
   *
   * @example source: '/(.*?)', // Match all paths, including "/"
   * @example source: '/:path*', // Match all paths, excluding "/"
   *
   * @return {Promise<Array<{ headers: [{value: string, key: string}], source: string }>>}
   * @see https://nextjs.org/docs/api-reference/next.config.js/headers
   * @since 9.5 - See https://nextjs.org/blog/next-9-5#headers
   */
  async headers() {
    const headers = [
      {
        // Make all fonts immutable and cached for one year
        source: "/static/fonts/(.*?)",
        headers: [
          {
            key: "Cache-Control",
            // See https://www.keycdn.com/blog/cache-control-immutable#what-is-cache-control-immutable
            // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#browser_compatibility
            value: `public, max-age=31536000, immutable`,
          },
        ],
      },
      {
        // Make all other static assets immutable and cached for one hour
        source: "/static/(.*?)",
        headers: [
          {
            key: "Cache-Control",
            // See https://www.keycdn.com/blog/cache-control-immutable#what-is-cache-control-immutable
            // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#browser_compatibility
            value: `public, max-age=3600, immutable`,
          },
        ],
      },
      {
        source: "/(.*?)", // Match all paths, including "/" - See https://github.com/vercel/next.js/discussions/17991#discussioncomment-112028
        headers: [
          // This directive helps protect against some XSS attacks
          // See https://infosec.mozilla.org/guidelines/web_security#x-content-type-options
          {
            key: "X-Content-Type-Options",
            value: `nosniff`,
          },
        ],
      },
      {
        source: "/(.*?)", // Match all paths, including "/" - See https://github.com/vercel/next.js/discussions/17991#discussioncomment-112028
        headers: [
          // This directive helps protect user's privacy and might avoid leaking sensitive data in urls to 3rd parties (e.g: when loading a 3rd party asset)
          // See https://infosec.mozilla.org/guidelines/web_security#referrer-policy
          // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
          // See https://scotthelme.co.uk/a-new-security-header-referrer-policy/
          {
            key: "Referrer-Policy",
            // "no-referrer-when-downgrade" is the default behaviour
            // XXX You might want to restrict even more the referrer policy
            value: `no-referrer-when-downgrade`,
          },
        ],
      },
    ];

    console.info("Using headers:", JSON.stringify(headers, null, 2));

    return headers;
  },
};
