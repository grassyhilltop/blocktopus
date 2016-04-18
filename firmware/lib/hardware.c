#include "hardware.h"
#include "usbdrv/usbdrv.h"

void set_output_high(void){
	PORTB |= _BV(OUTPUT_PORT);
}
void set_output_low(void){
	PORTB &= ~_BV(OUTPUT_PORT);
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

void initStatusLED()
{
	DDRB |= _BV(STATUS_LED_PORT); 	// Set LED pin PB1 to be an output

	// Timer 1 prescaler (blink counter speed):
	TCCR1 = _BV(CS12);								// 1:8
	// TCCR1 = _BV(CS11) | _BV(CS12);				// 1:32
	// TCCR1 = _BV(CS10) | _BV(CS11) | _BV(CS12);	// 1:64
	// TCCR1 = _BV(CS10) | _BV(CS13);				// 1:256
	// TCCR1 = _BV(CS10) | _BV(CS11) | _BV(CS13);	// 1:1024

	TIMSK = _BV(TOIE1); // Enable timer 1 overflow interrupt
	// TIMSK = _BV(OCIE1A);	// Enable timer 1 compare match A interrupt

	// Set timer 1 output compare register A.
	// OCR1A = 127;
}

