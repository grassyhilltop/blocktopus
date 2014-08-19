#include "main.h"
#include "hardware.h"
#include "usbdrv/usbdrv.h"

//this assumes only one pin
void turn_on(void){
	PORTB |= _BV(OUTPUT_PORT);	// Switch status LED on
}
void turn_off(void){
	PORTB &= ~_BV(OUTPUT_PORT); // LED off
}