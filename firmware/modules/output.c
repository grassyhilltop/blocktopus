#include "output.h"
#include "usbdrv/usbdrv.h"
#include "main.h"
#include "hardware.h"
#include <stdbool.h>

static unsigned int duty_cycle = 0;
static const unsigned int iterations_p_cycle = 100;

void init_output(void){
	initPB3AsOutput();
}

void output_main_loop(void){
	static bool is_status_led_on = false;
	unsigned int counter = 0;
	
	for (counter = 0; counter < iterations_p_cycle ; counter ++){
		if ((counter++ % iterations_p_cycle) < duty_cycle){
			if (!is_status_led_on){
				turn_on();
				is_status_led_on = true;
			}
		}
		else{
			if(is_status_led_on){
				turn_off();
				is_status_led_on = false;
			}
		}
	}
}

void output_usb_input_handler(unsigned char * midiMsg, unsigned char len){

		if(midiMsg[1] == 0x90){
			// blink();
			// Turn on OUTPUT
			duty_cycle = iterations_p_cycle;			
		}
		else if (midiMsg[1] == 0xE3){
			duty_cycle = (unsigned int) midiMsg[3];
		}
		// Note off message 0x80
		else if(midiMsg[1] == 0x80 ){				
			duty_cycle = 0;
		} 			
}
