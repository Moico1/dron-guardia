#include "../include/fire_model.h"

#include <errno.h>
#include <inttypes.h>
#include <omp.h>
#include <stdio.h>
#include <stdlib.h>

static void usage(const char *program)
{
    fprintf(stderr, "Uso: %s [-n simulaciones] [-s semilla] [-b columna_cortafuego] [-t hilos] [-S static|dynamic]\n", program);
}

int main(int argc, char **argv)
{
    long simulations = 10000;
    uint64_t seed = UINT64_C(20261104);
    int firebreak_column = -1;
    int threads = 0;
    omp_sched_t schedule = omp_sched_static;
    for (int index = 1; index < argc; index++) {
        char *end = NULL;
        errno = 0;
        if (argv[index][0] != '-' || index + 1 >= argc) { usage(argv[0]); return 2; }
        switch (argv[index][1]) {
        case 'n': simulations = strtol(argv[++index], &end, 10); break;
        case 's': seed = strtoull(argv[++index], &end, 10); break;
        case 'b': firebreak_column = (int)strtol(argv[++index], &end, 10); break;
        case 't': threads = (int)strtol(argv[++index], &end, 10); break;
        case 'S':
            index++;
            if (strcmp(argv[index], "static") == 0) schedule = omp_sched_static;
            else if (strcmp(argv[index], "dynamic") == 0) schedule = omp_sched_dynamic;
            else { usage(argv[0]); return 2; }
            continue;
        default: usage(argv[0]); return 2;
        }
        if (errno || end == argv[index] || *end != '\0') { usage(argv[0]); return 2; }
    }
    if (simulations < 1 || firebreak_column < -1 || firebreak_column >= FIRE_WIDTH || threads < 0) {
        usage(argv[0]); return 2;
    }

    if (threads > 0) omp_set_num_threads(threads);
    omp_set_schedule(schedule, 0);
    long hits = 0;
    double start = omp_get_wtime();
    #pragma omp parallel for schedule(runtime) reduction(+:hits)
    for (long scenario = 0; scenario < simulations; scenario++) {
        hits += fire_scenario_reaches_town(seed, (uint64_t)scenario, firebreak_column);
    }
    double elapsed = omp_get_wtime() - start;
    printf("simulaciones=%ld incendios=%ld riesgo=%.9f t_calculo=%.6f hilos=%d schedule=%s semilla=%" PRIu64 " barrera=%d\n",
           simulations, hits, (double)hits / simulations, elapsed,
           threads > 0 ? threads : omp_get_max_threads(),
           schedule == omp_sched_static ? "static" : "dynamic", seed, firebreak_column);
    return 0;
}
