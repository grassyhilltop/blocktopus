#ifndef ANALOG_INPUT_DEVICE_H
#define ANALOG_INPUT_DEVICE_H

#include <stdint.h>

void init_analog_input_device(void);
void analog_input_device_main_loop(uint8_t uADC);

#endif
