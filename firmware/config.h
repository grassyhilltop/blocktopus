#ifndef CONFIG_H
#define CONFIG_H

/* TODO: for some reason using enums results in code auto-generation or parsing errors. */
/* typedef enum ModuleType { */
/* 	ANALOG_INPUT, */
/* 	ANALOG_OUTPUT, */
/* 	DIGITAL_INPUT, */
/* 	DIGITAL_OUTPUT, */
/* 	I2C_DEVICE, */
/* /1* Left-over old module types. *1/ */
/*   KNOB, */
/*   BUTTON, */
/*   OUTPUT, */
/*   RGB_LED, */
/*   COMPASS, */
/*   ACCELEROMETER, */
/* } ModuleType; */

// MODULE_TYPE is passed in via Makefile flag
#define KNOB   1
#define BUTTON 2
#define OUTPUT 3
#define RGB_LED 4
#define COMPASS 5
#define ACCELEROMETER 6
#define ANALOG_INPUT 7
#define ANALOG_OUTPUT 8
#define DIGITAL_INPUT 9
#define DIGITAL_OUTPUT 10
#define I2C_DEVICE 11

#endif
