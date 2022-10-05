#!/usr/bin/env wsl

set -e

rm -rf .build
mkdir -p ./.build

npx esbuild src \
	--log-level=warning \
	--outdir='./dist' \
	--outbase=. \
	--sourcemap \
	--target='node16' \
	--platform='node'
