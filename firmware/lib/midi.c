#include "usbdrv/usbdrv.h"
#include "hardware.h"
#include "main.h"
#include "config.h"
#include <util/delay.h>

enum {
  NOTE_MIDI_MSG_LEN = 4,
  MIN_MIDI_MSG_LEN = 2,
  FIVE_SECONDS_MS = 5000,
};
void sendNoteOn() {
	uint8_t midiMsg[NOTE_MIDI_MSG_LEN];
	set_output_high();

	// Send a note on message if this was a button down
	//http://forums.obdev.com/viewtopic.php?f=8&t=1352&start=30
	// 10010000= 90= 144	Chan 1 Note on	 Note Number (0-127)	 Note Velocity (0-127)

	midiMsg[0] =  0x09 ; // /** 0x09 High nybble is the cable number (we only have one) the second is the event code -> 9 = NOTE-ON */
	midiMsg[1] =  0x90;  //1001b (noteon=9) 0000 ch0
	midiMsg[2] =  0x3c ; // Note: 60 middle C
	// midiMsg[2] =  67 ; // Note: G3 above middle C
	midiMsg[3] =  0x45 ; // velocity 

	// Send a note on
	usbSetInterrupt(midiMsg, NOTE_MIDI_MSG_LEN);
}

void sendNoteOff() {	
	uint8_t midiMsg[NOTE_MIDI_MSG_LEN];					

	set_output_low();

	// send note msg
	midiMsg[0] =  0x09 ; // /** 0x09 High nybble is the cable number (we only have one) the second is the event code -> 9 = NOTE-ON */
	midiMsg[1] =  0x80;  // NOTE OFF
	midiMsg[2] =  0x3c ; // Note: 60 middle C
	midiMsg[3] =  0x45 ; // velocity 

	// Send note off
	usbSetInterrupt(midiMsg, NOTE_MIDI_MSG_LEN);
}

void sendPitchBend(uchar pitch) {
	uchar midiMsg[8];
	
	// MIDI pitch msg
	midiMsg[0] = 0x0e;			// CN = 0 (high nibble), CID = control change (low nibble)
	midiMsg[1] = 0xE3; //1110 pitch wheel -  14 decimal					
	// Send pitch bend data
	midiMsg[2] = 0;			// cc
	midiMsg[3] = pitch;		// 7 bit
	usbSetInterrupt(midiMsg, 4);

	// Or use this for control change - generic
	// midiMsg[0] = 0x0b;			// CN = 0 (high nibble), CID = control change (low nibble)
	// midiMsg[1] = 0xb0;			// Channel voice message "Control change" (1011xxxx) on channel 1 (xxxx0000)
	// midiMsg[2] = 70;			// cc
	// midiMsg[3] = uADC >> 1;		// 7 bit
	// usbSetInterrupt(midiMsg, 4);				
}

void sendSysExMsg(uint8_t msg)
{
  uint8_t midiMsg[10];
	midiMsg[0] =  0x0f; // 0x09 High nibble = cable number, low-nibble = sysex
	midiMsg[1] =  0xf0; // message type: SysEx
	midiMsg[2] =  msg;  // data byte
	midiMsg[3] =  0xf7; // terminate message

  usbSetInterrupt(midiMsg, 4);
}

void handleSysExMsg(uint8_t *midiMsg, uint8_t len){
  if (len < MIN_MIDI_MSG_LEN) {
    return;
  }
  // Note from Charles: MIDI standards would normally put the SysEx code of 0xF0
  // in byte 0 (midiMsg[0]), but I think some of the MIDI msg handling uses a
  // header byte
  if (midiMsg[1] == 0xF0) { // SysEx message code of 0xF0
    switch (midiMsg[2]) {
      case ANALOG_INPUT:
        update_module_type(ANALOG_INPUT);
        break;
      case ANALOG_OUTPUT:
        update_module_type(ANALOG_OUTPUT);
        break;
      case DIGITAL_INPUT:
        update_module_type(DIGITAL_INPUT);
        break;
      case DIGITAL_OUTPUT:
        update_module_type(DIGITAL_OUTPUT);
        break;
      case I2C_DEVICE:
        update_module_type(I2C_DEVICE);
        break;
      case REQUEST_DEVICE_TYPE:
        /* Send sysex message with device type back. */
        sendSysExMsg(get_module_type());
        break;
      case WDT_RESET:
        /* Delay to make watchdog timer elapse and cause device reset. */
        _delay_ms(FIVE_SECONDS_MS);
        /* _delay_ms does not return due to 2-second watchdog timer. */
        break;
      default:
        /* Do nothing. */
        break;
    }
  }
}
