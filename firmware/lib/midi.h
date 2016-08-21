#ifndef MIDI_H
#define MIDI_H

#include <stdint.h>

void sendNoteOn(void);
void sendNoteOff(void);
void sendPitchBend(unsigned char pitch);
void sendSysExByte(uint8_t msg);
void handleSysExMsg(uint8_t *midiMsg, uint8_t len);

#endif
