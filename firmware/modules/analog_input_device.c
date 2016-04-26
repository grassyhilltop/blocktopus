#include "midi.h"
#include "analog_input_device.h"
#include "hardware.h"

void init_analog_input_device(void){
	initAnalogInput();
}

void analog_input_device_main_loop(uint8_t uADC){
	static uint8_t analog_value = 0;
	static uint8_t old_analog_value = 0;
	uint8_t adc_value = uADC >> 1;
	
	/* Smooth out values read from ADC. */
	analog_value = (3*analog_value + adc_value)/4;
	
	if (analog_value != old_analog_value) {
		/* Use PitchBend from MIDI protocol to emulate a value send. */
		sendPitchBend(analog_value);
	}
	
	old_analog_value = analog_value;
}

void analog_input_device_usb_input_handler(uint8_t *midiMsg, uint8_t len)
{
  handleSysExMsg(midiMsg, len);
}
