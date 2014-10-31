“bootloader-1secdelay.hex” is a hex file of micronucleus bootlader - compiled 

Description: Adds bootloading capability to a USB Octomodule. In the first second that the board is powered it will wait to see if you try and flash new code, otherwise it will just boot into the loaded program.

----------------------------------------------------------------
FIRST TIME MICRONUCLEUS SETUP:
(Assuming Attiny85 microcontroller, with avrispmkII programmer, and avrdude installed)

1. Put this .hex on a virgin board using the following terminal commands:

 //Set the fuses
 avrdude -c avrispmkII -p attiny85  -U lfuse:w:0xe1:m -U hfuse:w:0xdd:m -U efuse:w:0xfe:m

 // Put the firmware on the board
 avrdude -c avrispmkII -p attiny85 -U flash:w:bootloader-1secdelay.hex

2. Add the compiled micronucleus binary (OSX version from the project folder) to your /usr/local/bin/ , or to your path.

----------------------------------------------------------------

(AFTER SETUP) - TO LOAD ON NEW HEX FIRMWARE WITH MICRONUCLEUS:

 // Loads in a compiled .hex file to the microcontroller over USB
 micronucleus --run {name of compiled hex file}.hex

or if you don’t have micronucleus in your path you can just run a local binary:
./micronucleus --run {name of compiled hex file}.hex



----------------------------------------------------------------

Modifications: 

Note that the only modification to the original project was to decrease the default time that the microcontroller stays in  waits. in “bootloaderconfig.h”:

#define AUTO_EXIT_MS           1000

INSTRUCTIONS TO MODIFY BOOTLOADER:
If you want to recompile a custom micronucleus e.g.to change some of the configuration just go into the micronucleus project folder and run:

> make clean
> make

This will make a new .hex file “main.hex”

———