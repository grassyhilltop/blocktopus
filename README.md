 blocktopus
==========

Code in Firmware folder contains all the project files for implementing a V-USB MIDI device with an Attiny85 microcontroller.
This code is based on objective development's sample code for V-USB with MIDI and Thortsen's Attiny85 USB MIDI project 
Original Project: http://electronicsodyssey.blogspot.com/2011/10/atmel-attiny45-attiny85-based-usb-midi.html

To get the code burned onto an Attiny chip you need to:
1. Compile the code into a .hex file
2. Upload the hex file into the chip

1.Compiling a Hex from C code (MAC):
-----------------------------------------
You can use "crosspack" to generate c-code projects, compile code for atmel and gernate hex files to the micro. 
Download and install from here:  http://www.obdev.at/products/crosspack/index-de.html

Navigate into the firmware folder and try compiling a hexfile by running make 
with an argument to specifcy the desired name of the hexfile:
e.g. in the console run:

// compiles the firmware into a hex file called main.hex
> make main.hex  


2.Flashing a hex file into the Attiny Chip ( Over USB with micronucleus)
------------------------------------------
This project is intended to use a bootloader to allow flashing of new firmware directly over USB.
Install the latest version of the commandline tool micronucleus from here: https://github.com/micronucleus/micronucleus

example usage - run the following command and THEN plug into the device:

//invokes micronucleus to put the hex file "main.hex" into a compatible attiny85 over USB (OSX)
> micronucleus --run main.hex  

// Linux Ubuntu requires
> sudo micronucleus --run main.hex  

This assumes that you are plugging in an Attiny85 that has already had the bootloader pre-flashed into it.
If you are starting from scractch with a raw Attiny85 with no bootloader -you will have to follow the instructions below
in the notes to put bootloader code on the Attiny85 using a programmer.


Other notes:
------------
Note that if there is no bootloader on the chip - you can flash firmware manually the "hard" way using a programmer.
Assumes that you wired up the programmer to the appropriate pins of the microcontroller.

I found lady ada's instructions on using the avr programmer helpful :
http://www.ladyada.net/learn/avr/avrdude.html

Example:
Run the "avrdude" commandline tool ( which was probably installed along with crosspack in step 1)
example usage:

// involkes avrdude to flash the file "main.hex" into an attiny85 chip ( the -p flag specifies the chip type) 
// The -c flag tells avrdude what kind of physical programmer you are using e.g. an avrispmkII programmer
// Use "usbtiny" for the Sparkfun Tiny AVR Programmer
> avrdude -c avrispmkII -p attiny85 -U flash:w:main.hex



You may also need to set fuses on the chip in order for it to be in the right mode for v-usb
Using the fuses from this project seems to work ok: http://scriptogr.am/174763/post/attinyusbstick
e.g. :

// sets the fuses on the Attiny85 to be v-usb friendly
> avrdude -c avrispmkII -p attiny85 -U lfuse:w:0xe1:m -U efuse:w:0xfe:m -U hfuse:w:0xdd:m

Windows Users: 
For compiling you can use Avrstudio (windows only)
