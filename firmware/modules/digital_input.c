#include "midi.h"
#include "button.h"
#include "hardware.h"

void init_button(void){
	initAnalogInput();
}

void button_main_loop(unsigned char uADC){

	static int avgButtonValue = 0;
	static char buttonState = 0;
	int newButtonValue = uADC >> 1;
	
	avgButtonValue = (4*avgButtonValue + newButtonValue)/ 5;
	
	if (avgButtonValue > 80){
		if (!buttonState){
			sendNoteOn();
			buttonState = 1;
		}
	}
	else if (avgButtonValue < 50){
		if (buttonState){
			buttonState = 0;
			sendNoteOff();	
		}
	}
}
