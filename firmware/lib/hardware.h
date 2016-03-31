#ifndef HARDWARE_H
#define HARDWARE_H

#define STATUS_LED_PORT 	DDB1
#define OUTPUT_PORT 	DDB3 // PB3 as output 

void turn_on_status_led(void);
void turn_off_status_led(void);
void initPB3AsOutput();
void initPB4AsOutput();
void initAnalogInput();
void setPB3High();
void setPB4High();

#endif
