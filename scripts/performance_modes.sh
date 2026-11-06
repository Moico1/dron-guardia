#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

output=data/performance_modes.csv
summary=data/performance_summary.csv
nproc_value=$(nproc)
ram_kb=$(awk '/^MemTotal:/ {print $2; exit}' /proc/meminfo)
repetitions=${REPEAT_COUNT:-5}
test "$repetitions" -ge 5
printf 'modo,variante,trabajadores,repeticiones,mediana_s,min_s,max_s,desviacion_s,nproc,ram_kb\n' > "$output"

extract_time() {
    printf '%s\n' "$1" | sed -n 's/.*t_calculo=\([^ ]*\).*/\1/p'
}

measure() {
    mode=$1
    variant=$2
    workers=$3
    config="data/${mode}.conf"
    values=''
    repetition=1
    while [ "$repetition" -le "$repetitions" ]; do
        case "$variant" in
            serial) result=$(./build/fire_serial --config "$config") ;;
            openmp) result=$(./build/fire_omp --config "$config" -t "$workers" -S static) ;;
            mpi) result=$(mpirun --allow-run-as-root -np "$workers" ./build/fire_mpi --config "$config") ;;
            *) printf 'Variante desconocida: %s\n' "$variant" >&2; exit 2 ;;
        esac
        value=$(extract_time "$result")
        test -n "$value"
        values="$values$value\n"
        repetition=$((repetition + 1))
    done
    sorted=$(printf '%b' "$values" | sed '/^$/d' | sort -n)
    minimum=$(printf '%s\n' "$sorted" | sed -n '1p')
    median=$(printf '%s\n' "$sorted" | awk '{ values[NR] = $1 } END { if (NR % 2) printf "%.6f", values[(NR + 1) / 2]; else printf "%.6f", (values[NR / 2] + values[NR / 2 + 1]) / 2 }')
    maximum=$(printf '%s\n' "$sorted" | tail -n 1)
    mean=$(printf '%s\n' "$sorted" | awk '{ sum += $1 } END { printf "%.9f", sum / NR }')
    deviation=$(printf '%s\n' "$sorted" | awk -v mean="$mean" '{ sum += ($1 - mean) * ($1 - mean) } END { printf "%.6f", sqrt(sum / NR) }')
    printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' "$mode" "$variant" "$workers" "$repetitions" "$median" "$minimum" "$maximum" "$deviation" "$nproc_value" "$ram_kb" >> "$output"
}

for mode in recon wind interface; do
    measure "$mode" serial 1
    for workers in 1 2 4 8; do measure "$mode" openmp "$workers"; done
    for workers in 1 2 3; do measure "$mode" mpi "$workers"; done
done

awk -F, '
NR == 1 { next }
{ rows[NR] = $0; mode[NR] = $1; variant[NR] = $2; workers[NR] = $3; median[NR] = $5; nproc[NR] = $9; ram[NR] = $10; if ($2 == "serial") baseline[$1] = $5 }
END {
    print "modo,variante,trabajadores,mediana_s,speedup,eficiencia,desviacion_s,nproc,ram_kb"
    for (row = 2; row <= NR; row++) if (row in rows) {
        speedup = baseline[mode[row]] / median[row]
        efficiency = (variant[row] == "serial") ? 1 : speedup / workers[row]
        deviation = 0
        split(rows[row], fields, ",")
        deviation = fields[8]
        printf "%s,%s,%s,%.6f,%.6f,%.6f,%s,%s,%s\n", mode[row], variant[row], workers[row], median[row], speedup, efficiency, deviation, nproc[row], ram[row]
    }
}' "$output" > "$summary"
printf 'PERFORMANCE_OK raw=%s summary=%s hardware_nproc=%s ram_kb=%s\n' "$output" "$summary" "$nproc_value" "$ram_kb"
