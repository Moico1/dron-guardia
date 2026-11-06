#ifndef FIRE_MODEL_H
#define FIRE_MODEL_H

#include <stdint.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define FIRE_WIDTH 24
#define FIRE_HEIGHT 16
#define FIRE_STEPS 32

typedef struct {
    long simulations;
    uint64_t seed;
    int firebreak_column;
    int mesh_width;
    int mesh_height;
    int initial_fires;
    long spread_interval_ms;
    double wind_intensity;
    double fuel_factor;
    int wind_changes;
    long wind_change_at_ms;
} FireConfig;

static inline void fire_config_defaults(FireConfig *config)
{
    config->simulations = 10000;
    config->seed = UINT64_C(20261104);
    config->firebreak_column = -1;
    config->mesh_width = FIRE_WIDTH;
    config->mesh_height = FIRE_HEIGHT;
    config->initial_fires = 1;
    config->spread_interval_ms = 0;
    config->wind_intensity = 0.17;
    config->fuel_factor = 1.0;
    config->wind_changes = 0;
    config->wind_change_at_ms = 0;
}

static inline int fire_parse_long(const char *text, long *result)
{
    char *end = NULL;
    errno = 0;
    *result = strtol(text, &end, 10);
    return errno == 0 && end != text && *end == '\0';
}

static inline int fire_parse_uint64(const char *text, uint64_t *result)
{
    char *end = NULL;
    errno = 0;
    *result = strtoull(text, &end, 10);
    return errno == 0 && end != text && *end == '\0';
}

static inline int fire_parse_double(const char *text, double *result)
{
    char *end = NULL;
    errno = 0;
    *result = strtod(text, &end);
    return errno == 0 && end != text && *end == '\0';
}

static inline int fire_config_load(const char *path, FireConfig *config)
{
    FILE *file = fopen(path, "r");
    if (!file) return -1;

    char line[256], key[64], value[128];
    int valid = 1;
    while (valid && fgets(line, sizeof(line), file)) {
        if (line[0] == '#' || line[0] == '\n' || line[0] == '\0') continue;
        if (sscanf(line, " %63[^=]=%127s", key, value) != 2) {
            valid = 0;
            break;
        }
        long integer_value = 0;
        if (strcmp(key, "mode") == 0) continue;
        if (strcmp(key, "simulations") == 0) valid = fire_parse_long(value, &config->simulations);
        else if (strcmp(key, "seed") == 0) valid = fire_parse_uint64(value, &config->seed);
        else if (strcmp(key, "firebreak") == 0) {
            valid = fire_parse_long(value, &integer_value);
            config->firebreak_column = (int)integer_value;
        } else if (strcmp(key, "mesh_width") == 0) {
            valid = fire_parse_long(value, &integer_value);
            config->mesh_width = (int)integer_value;
        } else if (strcmp(key, "mesh_height") == 0) {
            valid = fire_parse_long(value, &integer_value);
            config->mesh_height = (int)integer_value;
        } else if (strcmp(key, "initial_fires") == 0) {
            valid = fire_parse_long(value, &integer_value);
            config->initial_fires = (int)integer_value;
        } else if (strcmp(key, "spread_interval_ms") == 0) {
            valid = fire_parse_long(value, &config->spread_interval_ms);
        } else if (strcmp(key, "wind_intensity") == 0) {
            valid = fire_parse_double(value, &config->wind_intensity);
        } else if (strcmp(key, "fuel_factor") == 0) {
            valid = fire_parse_double(value, &config->fuel_factor);
        } else if (strcmp(key, "wind_changes") == 0) {
            if (strcmp(value, "yes") == 0) config->wind_changes = 1;
            else if (strcmp(value, "no") == 0) config->wind_changes = 0;
            else valid = 0;
        } else if (strcmp(key, "wind_change_at_ms") == 0) {
            valid = fire_parse_long(value, &config->wind_change_at_ms);
        } else {
            valid = 0;
        }
    }
    fclose(file);
    if (!valid || config->simulations < 1 || config->mesh_width != FIRE_WIDTH ||
        config->mesh_height != FIRE_HEIGHT || config->initial_fires < 1 ||
        config->spread_interval_ms < 0 || config->wind_intensity < 0.0 ||
        config->fuel_factor <= 0.0 || config->wind_change_at_ms < 0 ||
        config->firebreak_column < -1 ||
        config->firebreak_column >= FIRE_WIDTH) return -1;
    return 0;
}

static inline uint64_t fire_random_next(uint64_t *state)
{
    uint64_t value = (*state += UINT64_C(0x9E3779B97F4A7C15));
    value = (value ^ (value >> 30)) * UINT64_C(0xBF58476D1CE4E5B9);
    value = (value ^ (value >> 27)) * UINT64_C(0x94D049BB133111EB);
    return value ^ (value >> 31);
}

static inline double fire_random_unit(uint64_t *state)
{
    return (fire_random_next(state) >> 11) * (1.0 / 9007199254740992.0);
}

static inline int fire_scenario_reaches_town(uint64_t seed, uint64_t scenario,
                                              int firebreak_column)
{
    unsigned char burning[FIRE_HEIGHT][FIRE_WIDTH] = {{0}};
    unsigned char next[FIRE_HEIGHT][FIRE_WIDTH] = {{0}};
    uint64_t state = seed ^ ((scenario + 1) * UINT64_C(0xD6E8FEB86659FD93));
    if (state == 0) state = UINT64_C(0xA0761D6478BD642F);

    int ignition_y = (int)(fire_random_next(&state) % FIRE_HEIGHT);
    burning[ignition_y][0] = 1;

    const int dx[4] = {1, -1, 0, 0};
    const int dy[4] = {0, 0, 1, -1};
    const int town_left = FIRE_WIDTH - 3;
    const int town_top = FIRE_HEIGHT / 2 - 2;
    const int town_bottom = FIRE_HEIGHT / 2 + 2;

    for (int step = 0; step < FIRE_STEPS; step++) {
        memcpy(next, burning, sizeof(burning));
        for (int y = 0; y < FIRE_HEIGHT; y++) {
            for (int x = 0; x < FIRE_WIDTH; x++) {
                if (!burning[y][x]) continue;
                for (int direction = 0; direction < 4; direction++) {
                    int target_x = x + dx[direction];
                    int target_y = y + dy[direction];
                    if (target_x < 0 || target_x >= FIRE_WIDTH ||
                        target_y < 0 || target_y >= FIRE_HEIGHT ||
                        next[target_y][target_x] || target_x == firebreak_column) {
                        continue;
                    }

                    double terrain = 0.18 + (double)((target_x * 37 + target_y * 19) % 31) / 100.0;
                    double wind = dx[direction] == 1 ? 0.17 : (dx[direction] == -1 ? -0.09 : 0.0);
                    double probability = terrain + wind;
                    if (probability < 0.03) probability = 0.03;
                    if (probability > 0.72) probability = 0.72;
                    if (fire_random_unit(&state) >= probability) continue;
                    if (target_x >= town_left && target_y >= town_top && target_y <= town_bottom) {
                        return 1;
                    }
                    next[target_y][target_x] = 1;
                }
            }
        }
        memcpy(burning, next, sizeof(burning));
    }
    return 0;
}

#endif
