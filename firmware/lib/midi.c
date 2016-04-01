#include "usbdrv/usbdrv.h"
#include "main.h"
#include "hardware.h"

void sendNoteOn() {
	uchar midiMsg[8];
	turn_on();

	// Send a note on message if this was a button down
	//http://forums.obdev.com/viewtopic.php?f=8&t=1352&start=30
	// 10010000= 90= 144	Chan 1 Note on	 Note Number (0-127)	 Note Velocity (0-127)

	midiMsg[0] =  0x09 ; // /** 0x09 High nybble is the cable number (we only have one) the second is the event code -> 9 = NOTE-ON */
	midiMsg[1] =  0x90;  //1001b (noteon=9) 0000 ch0
	midiMsg[2] =  0x3c ; // Note: 60 middle C
	// midiMsg[2] =  67 ; // Note: G3 above middle C
	midiMsg[3] =  0x45 ; // velocity 
	midiMsg[4] = 0x00;
	midiMsg[5] = 0x00;
	midiMsg[6] = 0x00;
	midiMsg[7] = 0x00;				

	// Send a note on
	usbSetInterrupt(midiMsg, 4);
}

void sendNoteOff() {	
	uchar midiMsg[8];					

	turn_off();

	// send note msg
	//uchar midiMsg[8];
	midiMsg[0] =  0x09 ; // /** 0x09 High nybble is the cable number (we only have one) the second is the event code -> 9 = NOTE-ON */
	midiMsg[1] =  0x80;  // NOTE OFF
	// midiMsg[1] =  0x90;  //1001b (noteon=9) 0000 ch0
	midiMsg[2] =  0x3c ; // Note: 60 middle C
	midiMsg[3] =  0x45 ; // velocity 
	midiMsg[4] = 0x00;
	midiMsg[5] = 0x00;
	midiMsg[6] = 0x00;
	midiMsg[7] = 0x00;


	// Send note off
	usbSetInterrupt(midiMsg, 4);
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
