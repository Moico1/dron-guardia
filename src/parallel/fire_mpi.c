#include "../include/fire_model.h"

#include <errno.h>
#include <inttypes.h>
#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>

static void usage(const char *program)
{
    fprintf(stderr, "Uso: %s [-c|--config archivo] [-n simulaciones] [-s semilla] [-b columna_cortafuego]\n", program);
}

int main(int argc, char **argv)
{
    MPI_Init(&argc, &argv);
    int rank = 0, processes = 1;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &processes);

    long simulations = 10000;
    uint64_t seed = UINT64_C(20261104);
    int firebreak_column = -1;
    int parse_error = 0;
    FireConfig config;
    fire_config_defaults(&config);
    for (int index = 1; index < argc; index++) {
        char *end = NULL;
        errno = 0;
        if (argv[index][0] != '-' || index + 1 >= argc) { parse_error = 1; break; }
        if (strcmp(argv[index], "--config") == 0) {
            if (fire_config_load(argv[++index], &config) != 0) parse_error = 1;
            else { simulations = config.simulations; seed = config.seed; firebreak_column = config.firebreak_column; }
            continue;
        }
        switch (argv[index][1]) {
        case 'n': simulations = strtol(argv[++index], &end, 10); break;
        case 's': seed = strtoull(argv[++index], &end, 10); break;
        case 'b': firebreak_column = (int)strtol(argv[++index], &end, 10); break;
        case 'c':
            if (fire_config_load(argv[++index], &config) != 0) parse_error = 1;
            else { simulations = config.simulations; seed = config.seed; firebreak_column = config.firebreak_column; }
            continue;
        default: parse_error = 1; break;
        }
        if (parse_error || errno || end == argv[index] || *end != '\0') { parse_error = 1; break; }
    }
    if (simulations < 1 || firebreak_column < -1 || firebreak_column >= FIRE_WIDTH) parse_error = 1;
    if (parse_error) {
        if (rank == 0) usage(argv[0]);
        MPI_Finalize();
        return 2;
    }

    long local_hits = 0, global_hits = 0;
    double start = MPI_Wtime();
    for (long scenario = rank; scenario < simulations; scenario += processes) {
        local_hits += fire_scenario_reaches_town(seed, (uint64_t)scenario, firebreak_column);
    }
    MPI_Reduce(&local_hits, &global_hits, 1, MPI_LONG, MPI_SUM, 0, MPI_COMM_WORLD);
    double local_elapsed = MPI_Wtime() - start, elapsed = 0.0;
    MPI_Reduce(&local_elapsed, &elapsed, 1, MPI_DOUBLE, MPI_MAX, 0, MPI_COMM_WORLD);
    if (rank == 0) {
        printf("simulaciones=%ld incendios=%ld riesgo=%.9f t_calculo=%.6f procesos=%d semilla=%" PRIu64 " barrera=%d\n",
               simulations, global_hits, (double)global_hits / simulations,
               elapsed, processes, seed, firebreak_column);
    }
    MPI_Finalize();
    return 0;
}
