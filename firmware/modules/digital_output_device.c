/* Implements an digital_output_device module.
 * Acts as a PWM to enable both analog and digital analog_output_device.
 */
#include "analog_output_device.h"
#include "usbdrv/usbdrv.h"
#include "hardware.h"
#include "midi.h"
#include <stdbool.h>

enum {
	ITERATIONS_PER_PWM_PERIOD = 100,
};

void init_digital_output_device(void){
	initPB3AsOutput();
}

void digital_output_device_main_loop(void){
	/* Do nothing in main loop.
	 * All action is handled in USB message handler. */
}

void digital_output_device_usb_input_handler(uint8_t *midiMsg, uint8_t len){
  if (len < 2) {
    return;
  }
	// "Note on" message
	if(midiMsg[1] == 0x90){
		// blink();
		set_output_high();
	}
	// "Note off" message 0x80
	else if(midiMsg[1] == 0x80 ){
		set_output_low();
	}
  else {
    handleSysExMsg(midiMsg, len);
  }
}
