#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

extract_signature() {
    printf '%s\n' "$1" | sed -n 's/.*simulaciones=\([^ ]*\).*incendios=\([^ ]*\).*semilla=\([^ ]*\).*barrera=\([^ ]*\).*/\1,\2,\3,\4/p'
}

for mode in recon wind interface; do
    config="data/${mode}.conf"
    serial=$(./build/fire_serial --config "$config")
    openmp=$(./build/fire_omp --config "$config" -t 4 -S static)
    mpi=$(mpirun --allow-run-as-root -np 3 ./build/fire_mpi --config "$config")
    serial_signature=$(extract_signature "$serial")
    openmp_signature=$(extract_signature "$openmp")
    mpi_signature=$(extract_signature "$mpi")
    printf 'MODE=%s\nSERIAL %s\nOPENMP %s\nMPI %s\n' "$mode" "$serial" "$openmp" "$mpi"
    if [ "$serial_signature" != "$openmp_signature" ] || [ "$serial_signature" != "$mpi_signature" ]; then
        printf 'ERROR modo=%s serial=%s openmp=%s mpi=%s\n' "$mode" "$serial_signature" "$openmp_signature" "$mpi_signature" >&2
        exit 1
    fi
    printf 'MODE_OK modo=%s firma=%s\n' "$mode" "$serial_signature"
done
printf '%s\n' 'VERIFY_MODES_OK'
