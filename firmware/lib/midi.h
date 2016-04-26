#ifndef MIDI_H
#define MIDI_H

#include <stdint.h>

void sendNoteOn(void);
void sendNoteOff(void);
void sendPitchBend(unsigned char pitch);
void handleSysExMsg(uint8_t *midiMsg, uint8_t len);

#endif
