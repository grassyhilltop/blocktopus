#include "output.h"
#include "usbdrv/usbdrv.h"
#include "main.h"

static unsigned int duty_cycle = 0;
static unsigned int int_per_cycle = 100;

void output_timer_isr(void){
	static unsigned int counter = 0;
	
	if ((counter++ % int_per_cycle) < duty_cycle)
		PORTB |= _BV(OUTPUT_PORT);	// Switch status LED on
	else
		PORTB &= ~_BV(OUTPUT_PORT); // LED off
		
}

void output_usb_input_handler(unsigned char * midiMsg, unsigned char len){

		if(midiMsg[1] == 0x90){
			// blink();
			// Turn on OUTPUT
			duty_cycle = 100;			
		}
		else if (midiMsg[1] == 0xE3){
			duty_cycle = (unsigned int) midiMsg[3];
		}
		// Note off message 0x80
		else if(midiMsg[1] == 0x80 ){
			// PORTB |= _BV(STATUS_LED_PORT);	// Switch status LED on					
			duty_cycle = 0;
		} 			
}
