#include "midi.h"
#include "digital_input.h"
#include "hardware.h"

#include <stdbool.h>
#include <stdint.h>

void init_digital_input(void){
	initAnalogInput();
}

void digital_input_main_loop(uint8_t uADC){

	static int avg_adc_value = 0;
	static bool is_input_high = false;
	uint8_t new_adc_value = uADC >> 1;
	
	avg_adc_value = (4*avg_adc_value + new_adc_value)/ 5;
	
	if (avg_adc_value > 80){
		if (!is_input_high){
			sendNoteOn();
			is_input_high = true;
		}
	}
	else if (avg_adc_value < 50){
		if (is_input_high){
			is_input_high = false;
			sendNoteOff();	
		}
	}
}
