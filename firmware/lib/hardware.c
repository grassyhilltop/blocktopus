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

void initPB3AsOutput(){
	DDRB = _BV(DDB3); 	// LED pin = output
}

void initPB4AsOutput(){
	DDRB |= _BV(DDB4); 	// LED pin = output
}

void setPB3High(){
	PORTB |= _BV(DDB3);
}

void setPB4High(){
	PORTB |= _BV(DDB4);	
}


void initAnalogInput()
{
	ADMUX = _BV(ADLAR) | _BV(MUX1) | _BV(MUX0);		// Left adjust result (ADCH is result with 8 bit resolution), Vcc is reference voltage, sample port ADC3

	// Enable ADC,
	// start conversion,
	// ADC auto triger enable (starts "free running mode" because ADTS0 - 2 in ADCSRB are set to 0 at this point),
	// acivate ADC conversion complete interrupt,
	// set prescaler to 128
	ADCSRA = _BV(ADEN) | _BV(ADSC) | _BV(ADATE) | _BV(ADIE) | _BV(ADPS0)| _BV(ADPS1) | _BV(ADPS2);
}
