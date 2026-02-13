#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend/mobile"
npm install
exec npm run start

