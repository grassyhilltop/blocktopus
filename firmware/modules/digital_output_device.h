#ifndef DIGITAL_OUTPUT_DEVICE_H
#define DIGITAL_OUTPUT_DEVICE_H

#include <stdint.h>

void init_digital_output_device(void);
void digital_output_device_main_loop(void);
void digital_output_device_usb_input_handler(uint8_t * midiMsg, uint8_t len);

#endif
