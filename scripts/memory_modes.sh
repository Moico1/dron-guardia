#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

output=data/memory_modes.csv
nproc_value=$(nproc)
ram_kb=$(awk '/^MemTotal:/ {print $2; exit}' /proc/meminfo)
printf 'modo,variante,trabajadores,max_rss_kb,nproc,ram_kb,observacion\n' > "$output"

measure() {
    mode=$1
    variant=$2
    workers=$3
    config="data/${mode}.conf"
    report=$(mktemp)
    trap 'rm -f "$report"' EXIT HUP INT TERM
    case "$variant" in
        serial) /usr/bin/time -v ./build/fire_serial --config "$config" >/dev/null 2>"$report" ;;
        openmp) /usr/bin/time -v ./build/fire_omp --config "$config" -t "$workers" -S static >/dev/null 2>"$report" ;;
        mpi) /usr/bin/time -v mpirun --allow-run-as-root -np "$workers" ./build/fire_mpi --config "$config" >/dev/null 2>"$report" ;;
        *) printf 'Variante desconocida: %s\n' "$variant" >&2; exit 2 ;;
    esac
    rss=$(sed -n 's/^\s*Maximum resident set size (kbytes): \([0-9][0-9]*\).*/\1/p' "$report")
    test -n "$rss"
    observation='RSS del proceso medido por /usr/bin/time -v'
    [ "$variant" = mpi ] && observation='RSS del lanzador mpirun medido por /usr/bin/time -v; no es suma de ranks'
    printf '%s,%s,%s,%s,%s,%s,%s\n' "$mode" "$variant" "$workers" "$rss" "$nproc_value" "$ram_kb" "$observation" >> "$output"
    rm -f "$report"
    trap - EXIT HUP INT TERM
}

for mode in recon wind interface; do
    measure "$mode" serial 1
    for workers in 1 2 4 8; do measure "$mode" openmp "$workers"; done
    for workers in 1 2 3; do measure "$mode" mpi "$workers"; done
done
printf 'MEMORY_OK csv=%s hardware_nproc=%s ram_kb=%s\n' "$output" "$nproc_value" "$ram_kb"
