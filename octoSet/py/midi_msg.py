#!/usr/bin/python

'''
File: midi_msg.py
Author: Charles Guan
Last Edit: 2016-06-01
---------------------
This module sends MIDI messages to a USB device.
'''

import mido
import time

def print_message(message):
    print message, "HEX =", message.hex()
    data=(message.hex())[3:5]
    print data
def main():
    output_name = ''
    input_name = ''
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

    # or, with mido.open_ioport(output_name) as iop:
    with mido.open_output(output_name) as output:
        with mido.open_input(output_name, callback=print_message) as inp:
            #msg = mido.Message('sysex', data=[9]) #Set type to digital input
            #msg = mido.Message('sysex', data=[10]) #Set type to digital output
            #msg = mido.Message('sysex', data=[101]) # send watchdog timer reset
            #msg = mido.Message('sysex', data=[99]) # Request device type
            #msg = mido.Message('sysex', data=[77]) # Request device name
            msg = mido.Message('sysex', data=[54,2,2,2,2,2]) # Set device name to '0x010203'
            #msg = mido.Message('note_on')
            print "sending msg: ", msg
            output.send(msg);
            print "waiting for response message"
            time.sleep(100) # Pause while we get MIDO callback print-outs
    print "script done"


if __name__ == '__main__':
    main()

