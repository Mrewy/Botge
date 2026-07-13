#!/usr/bin/env bash

set -euo pipefail

if [ "$("$1" --version | awk '{print $NF}')" != "$(npm view "$1" version)" ]; then
  npm install -g "$1"
fi
