#!/bin/sh
# Builds the publish folder (dist/) with only the website itself: no original font files,
# source photos or notes. Used by Cloudflare Pages (build command: sh build.sh, output: dist)
# and by Netlify (netlify.toml).
set -e
rm -rf dist
mkdir dist
cp -R index.html work.html robots.txt sitemap.xml favicon.ico site.webmanifest _headers assets fonts dist/
rm -rf dist/fonts/src dist/assets/img/src

# Cache-busting: stamp every script and stylesheet link with this build's version, so visitors'
# browsers fetch the new files after each update instead of reusing old copies.
V=$(printf %s "${CF_PAGES_COMMIT_SHA:-${COMMIT_REF:-$(date +%s)}}" | cut -c1-8)
sed -i -E "s#((src|href)=\"/?assets/[^\"?]+\.(js|css))\"#\1?v=$V\"#g" dist/index.html dist/work.html
