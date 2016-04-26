#ifndef ANALOG_OUTPUT_DEVICE_H
#define ANALOG_OUTPUT_DEVICE_H

#include <stdint.h>

void init_analog_output_device(void);
void analog_output_device_main_loop(void);
void analog_output_device_usb_input_handler(uint8_t * midiMsg, uint8_t len);

#endif
