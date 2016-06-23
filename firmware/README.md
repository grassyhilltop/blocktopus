firmware
==========

1.Compiling a Hex from C code (MAC / Ubuntu):
---------------------------------------------
Updated usage

// compiles the firmware into a hex file called main.hex with MODULE\_TYPE
// initially set to ANALOG\_INPUT
> make hex MODULE\_TYPE=ANALOG\_INPUT


2.Modifying the module\_type
----------------------------
The python script midi\_msg.py uses Mido (MIDI Objects for Python, https://mido.readthedocs.io/en/latest/) in order to communicate with available MIDI devices. Possible messages include standard 'note\_on' and 'note\_off', as well as SysEx messages.

In the mido.Message('sysex') in midi\_msg.py, change the data parameter to the corresponding module type value (as given in config.h). For example, use data=[9] for DIGITAL\_INPUT. With a single ABRACAD USB module plugged in, execute the script in order to change the module type.

> ./midi\_msg.py

3.Debugging MIDI messages
-------------------------
In order to record all MIDI messages, use MIDI Monitor (Mac) or KMidimon (Linux).

Additionally, setting data=[99] (set in config.h as message REQUEST_DEVICE_TYPE) will cause the MIDI device to respond with its device type (Requires a mido.Read)

Note that each module type must have an explicit call to handleSysExMessage, or else it will not respond to SysEx messages from the Python script.
If SysEx message handling isn't working, check that the module type is as expected (e.g. running ANALOG_INPUT code instead of KNOB code)

4.Updating bootloader
---------------------
The original bootloader has a 2 second delay on every power up where it launches into the bootloader. This allows us to re-program each stick easily. Ideally, modules will eventually only be programmed once, then each module type will be modified using a midi communication on the fly.

The original version uses the ENTRY_ALWAYS option for ENTRYMODE in bootloaderconfig.h, while the updated version uses ENTRY_WATCHDOG. Thus, the bootloader is only entered after a reset due to a watchdog timer timeout. On normal resets in the new version, the main.hex program is entered directly.

Chips with the new bootloader can be reprogrammed using micronucleus by sending it a SysEx message with WDT_RESET as the data byte (defined in config.h). This forces the chip to delay until the watchdog timer resets the chip. The chip will then reset into the bootloader, and you can run micronucleus --run main.hex as usual.

If the module is stuck in a state where it does not respond to SysEx messages, but only can be programmed during a watchdog reset, simply re-flash manually using the programmer. On the first bootup, you can flash a hex file using micronucleus.
