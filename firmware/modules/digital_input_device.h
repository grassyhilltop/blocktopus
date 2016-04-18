#ifndef DIGITAL_INPUT_DEVICE_H
#define DIGITAL_INPUT_DEVICE_H

#include <stdint.h>

void init_digital_input_device(void);
void digital_input_device_main_loop(uint8_t uADC);

#endif
