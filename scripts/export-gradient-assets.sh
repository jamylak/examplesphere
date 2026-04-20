#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXPORT_SCRIPT="${SCRIPT_DIR}/export-assets.sh"

if [ ! -x "${EXPORT_SCRIPT}" ]; then
    echo "error: expected executable export helper at ${EXPORT_SCRIPT}" >&2
    exit 1
fi

render() {
    local shader_name="$1"
    local output_name="$2"

    echo
    echo "==> ${shader_name} -> exports/${output_name}"
    SHADER_PATH="${REPO_ROOT}/${shader_name}" \
    OUTPUT="${REPO_ROOT}/exports/${output_name}" \
    "${EXPORT_SCRIPT}"
}

render "sphere.frag" "sphere-showcase.mp4"
render "tri_3sample.frag" "tri-3sample.mp4"
render "tetra_4sample.frag" "tetra-4sample.mp4"
