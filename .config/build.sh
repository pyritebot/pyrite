#!/usr/bin/env bash

set -e

rm -rf .build
mkdir -p ./.build

ENTRYPOINTS=$(find -type f -name '*.[tj]s' -not -path './node_modules/*')

npx esbuild $ENTRYPOINTS \
	--log-level=warning \
	--outdir='./dist' \
	--outbase=. \
	--sourcemap \
	--target='node16' \
	--platform='node'

echo 'sus'
