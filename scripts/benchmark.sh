#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p data
output=data/benchmark.csv
printf 'version,hilos,schedule,simulaciones,repeticion,t_calculo\n' > "$output"
for simulations in 10000 100000; do
    for repetition in 1 2 3; do
        serial=$(./build/fire_serial -n "$simulations" -s 20261104 -b -1)
        serial_time=$(printf '%s\n' "$serial" | sed -n 's/.*t_calculo=\([^ ]*\).*/\1/p')
        printf 'serial,1,none,%s,%s,%s\n' "$simulations" "$repetition" "$serial_time" >> "$output"
        for schedule in static dynamic; do
            for threads in 1 2 4 8; do
                parallel=$(./build/fire_omp -n "$simulations" -s 20261104 -b -1 -t "$threads" -S "$schedule")
                parallel_time=$(printf '%s\n' "$parallel" | sed -n 's/.*t_calculo=\([^ ]*\).*/\1/p')
                printf 'openmp,%s,%s,%s,%s,%s\n' "$threads" "$schedule" "$simulations" "$repetition" "$parallel_time" >> "$output"
            done
        done
    done
done
printf 'Benchmark guardado en %s\n' "$output"
