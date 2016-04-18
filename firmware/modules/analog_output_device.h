#ifndef ANALOG_OUTPUT_DEVICE_H
#define ANALOG_OUTPUT_DEVICE_H

void init_analog_output_device(void);
void analog_output_device_main_loop(void);
void analog_output_device_usb_input_handler(unsigned char * midiMsg, unsigned char len);

#endif
