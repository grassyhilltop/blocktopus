#ifndef OUTPUT_H
#define OUTPUT_H

void output_timer_isr(void);
void output_usb_input_handler(unsigned char * midiMsg, unsigned char len);

#endif