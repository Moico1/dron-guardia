#!/bin/sh
set -eu

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT
source="$workdir/omp_smoke.c"
binary="$workdir/omp_smoke"

cat > "$source" <<'EOF'
#include <omp.h>
#include <stdio.h>

int main(void)
{
    int threads = 0;
#pragma omp parallel
    {
#pragma omp atomic
        threads++;
    }
    printf("OPENMP_SMOKE_OK hilos=%d\n", threads);
    return threads > 0 ? 0 : 1;
}
EOF

gcc -std=c11 -Wall -Wextra -Wpedantic -fopenmp "$source" -o "$binary"
OMP_NUM_THREADS="${OMP_NUM_THREADS:-4}" "$binary"
