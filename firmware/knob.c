#include "midi.h"
#include "knob.h"

void knob_main_loop(unsigned char uADC){
	static unsigned char pitch = 0;
	static unsigned char oldPitch = 0;
	int newPitch = uADC >> 1;
	
	pitch = (3*pitch + newPitch)/4;
	
	if (pitch != oldPitch)
		sendPitchBend(pitch);
	
	oldPitch = pitch;
}