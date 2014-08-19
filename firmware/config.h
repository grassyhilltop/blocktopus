#ifndef CONFIG_H
#define CONFIG_H

#define KNOB   1
#define BUTTON 2
#define OUTPUT 3

//Define the initial type of the module
//#define MODULE_TYPE BUTTON
#define MODULE_TYPE KNOB
//#define MODULE_TYPE OUTPUT

// Define firmware you want to include in the binary
#define INCLUDE_BUTTON_FW
#define INCLUDE_KNOB_FW
#define INCLUDE_OUTPUT_FW
#define INCLUDE_RGB_LED_FW

#endif