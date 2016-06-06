#!/usr/bin/python

'''
File: midi_msg.py
Author: Charles Guan
Last Edit: 2016-06-01
---------------------
This module sends MIDI messages to a USB device.
'''

import mido

def main():
    output_name = ''
    device_names = mido.get_input_names()
    for device_name in device_names:
        # FIXME: Heuristic to get our USB stick device
        if '-' in device_name and 'Through' not in device_name:
            output_name = device_name
            break
    else:
        print "No appropriate MIDI device. MIDI device names: ", device_names
        return

    print "Connected devices: ", device_names
    print "Opening device: ", output_name

    with mido.open_output(device_name) as output:
        with mido.open_input(device_name) as inp:
            #msg = mido.Message('sysex', data=[10])
            msg = mido.Message('sysex', data=[101]) # send watchdog timer reset
            #msg = mido.Message('note_on')
            print "sending msg: ", msg.hex()
            output.send(msg);
            print "sent!"
            #print "waiting for new message"
            #rcv = inp.receive()
            #print "received message: ", rcv.hex()


if __name__ == '__main__':
    main()

