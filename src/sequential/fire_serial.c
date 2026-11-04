#define _POSIX_C_SOURCE 200809L

#include "../include/fire_model.h"

#include <errno.h>
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static void usage(const char *program)
{
    fprintf(stderr, "Uso: %s [-n simulaciones] [-s semilla] [-b columna_cortafuego]\n", program);
}

int main(int argc, char **argv)
{
    long simulations = 10000;
    uint64_t seed = UINT64_C(20261104);
    int firebreak_column = -1;
    for (int index = 1; index < argc; index++) {
        char *end = NULL;
        errno = 0;
        if (index + 1 >= argc) { usage(argv[0]); return 2; }
        if (argv[index][0] != '-' || argv[index][2] != '\0') { usage(argv[0]); return 2; }
        switch (argv[index][1]) {
        case 'n': simulations = strtol(argv[++index], &end, 10); break;
        case 's': seed = strtoull(argv[++index], &end, 10); break;
        case 'b': firebreak_column = (int)strtol(argv[++index], &end, 10); break;
        default: usage(argv[0]); return 2;
        }
        if (errno || end == argv[index] || *end != '\0') { usage(argv[0]); return 2; }
    }
    if (simulations < 1 || firebreak_column < -1 || firebreak_column >= FIRE_WIDTH) {
        usage(argv[0]); return 2;
    }

    struct timespec start, finish;
    clock_gettime(CLOCK_MONOTONIC, &start);
    long hits = 0;
    for (long scenario = 0; scenario < simulations; scenario++) {
        hits += fire_scenario_reaches_town(seed, (uint64_t)scenario, firebreak_column);
    }
    clock_gettime(CLOCK_MONOTONIC, &finish);
    double elapsed = (finish.tv_sec - start.tv_sec) + (finish.tv_nsec - start.tv_nsec) / 1e9;
    printf("simulaciones=%ld incendios=%ld riesgo=%.9f t_calculo=%.6f semilla=%" PRIu64 " barrera=%d\n",
           simulations, hits, (double)hits / simulations, elapsed, seed, firebreak_column);
    return 0;
}
