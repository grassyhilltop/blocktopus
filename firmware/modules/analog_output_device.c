/* Implements an analog_output_device module.
 * Acts as a PWM to enable both analog and digital analog_output_device.
 */
#include "analog_output_device.h"
#include "usbdrv/usbdrv.h"
#include "hardware.h"
#include "midi.h"

#include <stdbool.h>
#include <util/delay.h>

enum {
	ITERATIONS_PER_PWM_PERIOD = 100,
	PWM_PERIOD_MS = 10,
	/* Time in microseconds for each tick, 1/100 of the overall
	 * PWM period. TODO: might not be able to HW PWM, so these
	 * enums don't have purpose then. */
	PWM_TICK_US = 100,
	MAX_DUTY_CYCLE = 100,
};

static uint8_t duty_cycle = 0;

void init_analog_output_device(void){
	initPB3AsOutput();
}

void analog_output_device_main_loop(void){
	/* if (duty_cycle == 0) { */
	/* 	/1* Force output LOW. *1/ */
	/* 	set_output_low(); */
	/* } else if (duty_cycle >= MAX_DUTY_CYCLE) { */
	/* 	/1* Force output HIGH. */
	/* 	 * Required to force output to get full 100% duty cycle in pratice. *1/ */
	/* 	set_output_high(); */
	/* } else { */
	/* 	set_output_high(); */
	/* 	_delay_us(duty_cycle * PWM_TICK_US); */
	/* 	set_output_low(); */
	/* 	_delay_us((MAX_DUTY_CYCLE - duty_cycle) * PWM_TICK_US); */
	/* 	/1* TODO can't use this because it requires us to know delay at compile time. How much does that matter? The other implementation is off, too. *1/ */
	/* } */
	static bool status = false;
	unsigned int counter = 0;
	
	/* note from charles: this assumes that the rest of the loop code is
	 * negligible compared to this code, which is not quite accurate.
	 * The ATtiny has hardware PWM capability, although this may
	 * interfere with the USB Software timing. */
	for (counter = 0; counter < ITERATIONS_PER_PWM_PERIOD ; counter ++){
		/* note from charles: counter is incremented twice per loop
		 * the increment is presumably intentional, but not sure */
		/* TODO use _delay_us instead of loops to get a more accurate version. Then try Hardware PWM and see how that affects USB */
		if ((counter++ % ITERATIONS_PER_PWM_PERIOD) < duty_cycle){
			if (!status){
				set_output_high();
				status = true;
			}
		}
		else{
			if(status){
				set_output_low();
				status = false;
			}
		}
	}
}

void analog_output_device_usb_input_handler(uint8_t * midiMsg, uint8_t len){
  if (len < 2) {
    return;
  }
	if(midiMsg[1] == 0x90){
		// blink();
		// Turn on analog_output_device
		duty_cycle = ITERATIONS_PER_PWM_PERIOD;
	}
	else if (midiMsg[1] == 0xE3){
		duty_cycle = (unsigned int) midiMsg[3];
	}
	// Note off message 0x80
	else if(midiMsg[1] == 0x80 ){
		duty_cycle = 0;
	}
  else {
    handleSysExMsg(midiMsg, len);
  }
}
