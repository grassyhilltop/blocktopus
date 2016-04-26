#!/usr/bin/python

'''
File: midi_msg.py
Author: Charles Guan
Last Edit: 2016-04-25
---------------------
This module sends some MIDI messages to a USB device.
'''

import mido

def main():
    output_name = ''
    device_names = mido.get_input_names()
    for device_name in device_names:
        # FIXME: Heuristic to get our USB stick device
        if '-' in device_name:
            output_name = device_name
            break
    else:
        print "No appropriate MIDI device. MIDI device names: ", device_names
        return

    with mido.open_output(device_name) as output:
        with mido.open_input(device_name) as inp:
            msg = mido.Message('sysex', data=[7])
            print "sending msg: ", msg.hex()
            output.send(msg);
            print "sent!"

if __name__ == '__main__':
    main()

