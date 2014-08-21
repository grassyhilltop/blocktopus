#ifndef CONFIG_H
#define CONFIG_H

#define KNOB   1
#define BUTTON 2
#define OUTPUT 3
#define RGB_LED 4
#define COMPASS 5

//Define the initial type of the module
//#define MODULE_TYPE BUTTON
//#define MODULE_TYPE KNOB
//#define MODULE_TYPE RGB_LED
//#define MODULE_TYPE OUTPUT
#define MODULE_TYPE COMPASS

// Define firmware you want to include in the binary
#define INCLUDE_BUTTON_FW
#define INCLUDE_KNOB_FW
#define INCLUDE_OUTPUT_FW
#define INCLUDE_RGB_LED_FW
#define INCLUDE_COPMASS_FW

#endif