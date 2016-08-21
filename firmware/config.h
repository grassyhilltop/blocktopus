#ifndef CONFIG_H
#define CONFIG_H

// MODULE_TYPE is passed in via Makefile flag
#define KNOB   1 // Deprecated, use ANALOG_INPUT
#define BUTTON 2 // Deprecated, use DIGITAL_INPUT
#define OUTPUT 3 // Deprecated, use ANALOG_OUTPUT or DIGITAL_OUTPUT
#define RGB_LED 4
#define COMPASS 5
#define ACCELEROMETER 6
#define ANALOG_INPUT 7
#define ANALOG_OUTPUT 8
#define DIGITAL_INPUT 9
#define DIGITAL_OUTPUT 10
#define I2C_DEVICE 11 // Not implemented fully

// SysEx message defines. Used in lib/midi.c
// Define values are arbitrary but must be representable by a byte
#define WDT_RESET 101
#define REQUEST_DEVICE_TYPE 99
#define REQUEST_DEVICE_NAME 77
#define SET_DEVICE_NAME 54

#endif
