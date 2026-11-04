#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

extract_hits() {
    printf '%s\n' "$1" | sed -n 's/.*incendios=\([0-9][0-9]*\).*/\1/p'
}

seed=20261104
simulations=20000
barrier=-1
serial_output=$(./build/fire_serial -n "$simulations" -s "$seed" -b "$barrier")
expected=$(extract_hits "$serial_output")
if [ -z "$expected" ]; then
    printf '%s\n' 'No se pudo leer el resultado serial.' >&2
    exit 1
fi

for schedule in static dynamic; do
    for threads in 1 2 4 8; do
        output=$(./build/fire_omp -n "$simulations" -s "$seed" -b "$barrier" -t "$threads" -S "$schedule")
        actual=$(extract_hits "$output")
        if [ "$actual" != "$expected" ]; then
            printf 'ERROR OpenMP schedule=%s hilos=%s serial=%s paralelo=%s\n' "$schedule" "$threads" "$expected" "$actual" >&2
            exit 1
        fi
        printf 'OPENMP_OK schedule=%s hilos=%s incendios=%s\n' "$schedule" "$threads" "$actual"
    done
done

mpi_output=$(mpirun --allow-run-as-root -np 3 ./build/fire_mpi -n "$simulations" -s "$seed" -b "$barrier")
mpi_hits=$(extract_hits "$mpi_output")
if [ "$mpi_hits" != "$expected" ]; then
    printf 'ERROR MPI serial=%s mpi=%s\n' "$expected" "$mpi_hits" >&2
    exit 1
fi
printf 'MPI_OK procesos=3 incendios=%s\n' "$mpi_hits"
printf 'VERIFICACION_OK simulaciones=%s semilla=%s\n' "$simulations" "$seed"
