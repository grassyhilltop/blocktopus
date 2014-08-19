#ifndef MIDI_H
#define MIDI_H

void sendNoteOn(void);
void sendNoteOff(void);
void sendPitchBend(unsigned char pitch);

#endif