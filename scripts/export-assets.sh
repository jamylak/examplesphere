#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

VSDF_BIN="${VSDF_BIN:-vsdf}"
SHADER_PATH="${SHADER_PATH:-${REPO_ROOT}/sphere.frag}"
EXPORT_DIR="${EXPORT_DIR:-${REPO_ROOT}/exports}"
OUTPUT="${OUTPUT:-${EXPORT_DIR}/sphere-showcase.mp4}"

FRAMES="${FRAMES:-480}"
FPS="${FPS:-60}"
WIDTH="${WIDTH:-1920}"
HEIGHT="${HEIGHT:-1080}"
CRF="${CRF:-18}"
PRESET="${PRESET:-slow}"
CODEC="${CODEC:-libx264}"

if [[ "${VSDF_BIN}" == */* ]]; then
    if [ ! -x "${VSDF_BIN}" ]; then
        echo "error: '${VSDF_BIN}' is not executable" >&2
        exit 1
    fi
elif ! command -v "${VSDF_BIN}" >/dev/null 2>&1; then
    echo "error: could not find '${VSDF_BIN}' in PATH" >&2
    echo "hint: install vsdf or set VSDF_BIN=/path/to/vsdf" >&2
    exit 1
fi

if [ ! -f "${SHADER_PATH}" ]; then
    echo "error: shader not found at ${SHADER_PATH}" >&2
    exit 1
fi

mkdir -p "$(dirname "${OUTPUT}")"

echo "Exporting ${SHADER_PATH}"
echo "Output: ${OUTPUT}"
echo "Frames: ${FRAMES} | FPS: ${FPS} | Size: ${WIDTH}x${HEIGHT}"

"${VSDF_BIN}" \
    --toy \
    --frames "${FRAMES}" \
    --ffmpeg-output "${OUTPUT}" \
    --ffmpeg-fps "${FPS}" \
    --ffmpeg-width "${WIDTH}" \
    --ffmpeg-height "${HEIGHT}" \
    --ffmpeg-crf "${CRF}" \
    --ffmpeg-preset "${PRESET}" \
    --ffmpeg-codec "${CODEC}" \
    "${SHADER_PATH}"

echo "Done: ${OUTPUT}"
