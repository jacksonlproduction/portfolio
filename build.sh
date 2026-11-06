#!/bin/sh
# Builds the publish folder (dist/) with only the website itself: no original font files,
# source photos or notes. Used by Cloudflare Pages (build command: sh build.sh, output: dist)
# and by Netlify (netlify.toml).
set -e
rm -rf dist
mkdir dist
cp -R index.html work.html robots.txt sitemap.xml favicon.ico site.webmanifest _headers assets fonts dist/
rm -rf dist/fonts/src dist/assets/img/src
