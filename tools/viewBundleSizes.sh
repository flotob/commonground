#!/bin/bash
cd ${0%/*}
cd ..
if [ ! -f ./tools/buildStats.json ]; then
  echo "Error: You have to enable the BundleAnalyzerPlugin in craco.config.js and then build the frontend to see the current build stats"
  exit 1
fi
npx webpack-bundle-analyzer ./tools/buildStats.json ./build