#!/usr/bin/env bash

set -euo pipefail

if [ "$(npm-check-updates --version)" != "$(npm view npm-check-updates version)" ]; then
  npm install -g npm-check-updates
fi
