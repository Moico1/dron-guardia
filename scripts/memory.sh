#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if ! command -v /usr/bin/time >/dev/null 2>&1; then
    printf '%s\n' 'Falta /usr/bin/time; instalar el paquete time para medir memoria.' >&2
    exit 1
fi
/usr/bin/time -v ./build/fire_omp -n 100000 -s 20261104 -b -1 -t 4
