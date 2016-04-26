#ifndef ANALOG_INPUT_DEVICE_H
#define ANALOG_INPUT_DEVICE_H

#include <stdint.h>

void init_analog_input_device(void);
void analog_input_device_main_loop(uint8_t uADC);
void analog_input_device_usb_input_handler(uint8_t* midiMsg, uint8_t len);

#endif
