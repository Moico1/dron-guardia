#ifndef FIRE_MODEL_H
#define FIRE_MODEL_H

#include <stdint.h>
#include <string.h>

#define FIRE_WIDTH 24
#define FIRE_HEIGHT 16
#define FIRE_STEPS 32

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
