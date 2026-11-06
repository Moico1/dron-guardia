#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

output=data/memory_modes.csv
nproc_value=$(nproc)
ram_kb=$(awk '/^MemTotal:/ {print $2; exit}' /proc/meminfo)
printf 'modo,variante,trabajadores,max_rss_kb,suma_rank_rss_kb,nproc,ram_kb,observacion\n' > "$output"

measure() {
    mode=$1
    variant=$2
    workers=$3
    config="data/${mode}.conf"
    report=$(mktemp)
    rank_dir=''
    cleanup() {
        rm -f "$report"
        if [ -n "$rank_dir" ]; then rm -rf "$rank_dir"; fi
    }
    trap cleanup EXIT HUP INT TERM
    case "$variant" in
        serial)
            /usr/bin/time -v ./build/fire_serial --config "$config" >/dev/null 2>"$report"
            rss=$(sed -n 's/^.*Maximum resident set size (kbytes): \([0-9][0-9]*\).*$/\1/p' "$report")
            rank_sum=$rss
            observation='RSS del proceso serial medido por /usr/bin/time -v'
            ;;
        openmp)
            /usr/bin/time -v ./build/fire_omp --config "$config" -t "$workers" -S static >/dev/null 2>"$report"
            rss=$(sed -n 's/^.*Maximum resident set size (kbytes): \([0-9][0-9]*\).*$/\1/p' "$report")
            rank_sum=$rss
            observation='RSS del proceso OpenMP medido por /usr/bin/time -v'
            ;;
        mpi)
            rank_dir=$(mktemp -d)
            DG_RANK_DIR=$rank_dir mpirun --allow-run-as-root -x DG_RANK_DIR -np "$workers" sh -c 'rank=${OMPI_COMM_WORLD_RANK}; /usr/bin/time -v ./build/fire_mpi --config "$1" >/dev/null 2>"$DG_RANK_DIR/rank-$rank.txt"' sh "$config"
            rss=0
            rank_sum=0
            for rank_report in "$rank_dir"/rank-*.txt; do
                test -f "$rank_report"
                rank_rss=$(sed -n 's/^.*Maximum resident set size (kbytes): \([0-9][0-9]*\).*$/\1/p' "$rank_report")
                test -n "$rank_rss"
                [ "$rank_rss" -gt "$rss" ] && rss=$rank_rss
                rank_sum=$((rank_sum + rank_rss))
            done
            observation='pico individual máximo y suma de RSS de los ranks; /usr/bin/time -v dentro de cada rank'
            ;;
        *) printf 'Variante desconocida: %s\n' "$variant" >&2; exit 2 ;;
    esac
    test -n "$rss"
    printf '%s,%s,%s,%s,%s,%s,%s,%s\n' "$mode" "$variant" "$workers" "$rss" "$rank_sum" "$nproc_value" "$ram_kb" "$observation" >> "$output"
    cleanup
    trap - EXIT HUP INT TERM
}

for mode in recon wind interface; do
    measure "$mode" serial 1
    for workers in 1 2 4 8; do measure "$mode" openmp "$workers"; done
    for workers in 1 2 3; do measure "$mode" mpi "$workers"; done
done
printf 'MEMORY_OK csv=%s hardware_nproc=%s ram_kb=%s\n' "$output" "$nproc_value" "$ram_kb"
