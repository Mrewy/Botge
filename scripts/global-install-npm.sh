#!/usr/bin/env bash

set -euo pipefail

if [ "$(npm --version)" != "$(npm view npm version)" ]; then
  npm install -g npm
fi
