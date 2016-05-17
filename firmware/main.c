/*
 * main.c
 *
 *  Created on: June , 2014
 *      Author: Joel  ( modified from Baum's original code )
 */
#include "main.h" // TODO delete main.h
#include "hardware.h"
#include "midi.h"
#include "i2c_bb.h"
#include "config.h"
#include <stdbool.h>
#include <stdint.h>
#include <avr/io.h>
#include <avr/interrupt.h>
#include <avr/sleep.h>
#include <avr/pgmspace.h>
#include <avr/wdt.h>
#include <avr/eeprom.h>
#include <util/delay.h>
#include "usbdrv/usbdrv.h"

#include "analog_output_device.h"
#include "analog_input_device.h"
#include "digital_input_device.h"
#include "digital_output_device.h"
#include "i2c_device.h"

enum {
	CYCLES_PER_SECOND = 8056,
	USB_DISCONNECT_DELAY_MS = 251,
	OSCCAL_EEPROM_ADDR = 0,
  SECONDS_PER_BLINK = 3,
};

static uint8_t * const MODULE_TYPE_EEPROM_ADDR = (uint8_t *)0x08;

//  Timing description: 1 Second is 8056 cycles
//  With a 1:8 prescaler - the timer ticks with frequency = 16.5Mhz/8 = 2 Mhz 
//  An 8 bit timer will overflow after 256 ticks  - i.e. 256 (*1/2 Mhz) every 0.124 ms
//  overflow every  = 256*1/(1650000000/8) s 

static unsigned char uADC = 0;		// Analog value

volatile uint8_t module_type = MODULE_TYPE;

// This descriptor is based on http://www.usb.org/developers/devclass_docs/midi10.pdf
//
// Appendix B. Example: Simple MIDI Adapter (Informative)
// B.1 Device Descriptor
//
static PROGMEM const char deviceDescrMIDI[] = {	/* USB device descriptor */
	18,			/* sizeof(usbDescriptorDevice): length of descriptor in bytes */
	USBDESCR_DEVICE,	/* descriptor type */
	0x10, 0x01,		/* USB version supported */
	0,			/* device class: defined at interface level */
	0,			/* subclass */
	0,			/* protocol */
	8,			/* max packet size */
	USB_CFG_VENDOR_ID,	/* 2 bytes */
	USB_CFG_DEVICE_ID,	/* 2 bytes */
	USB_CFG_DEVICE_VERSION,	/* 2 bytes */
	1,			/* manufacturer string index */
	2,			/* product string index */
	0,			/* serial number string index */
	1,			/* number of configurations */
};

// B.2 Configuration Descriptor
static PROGMEM const char configDescrMIDI[] = {	/* USB configuration descriptor */
	9,			/* sizeof(usbDescrConfig): length of descriptor in bytes */
	USBDESCR_CONFIG,	/* descriptor type */
	101, 0,			/* total length of data returned (including inlined descriptors) */
	2,			/* number of interfaces in this configuration */
	1,			/* index of this configuration */
	0,			/* configuration name string index */
	0,
	//USBATTR_BUSPOWER,
	USB_CFG_MAX_BUS_POWER / 2,	/* max USB current in 2mA units */

// B.3 AudioControl Interface Descriptors
// The AudioControl interface describes the device structure (audio function topology)
// and is used to manipulate the Audio Controls. This device has no audio function
// incorporated. However, the AudioControl interface is mandatory and therefore both
// the standard AC interface descriptor and the classspecific AC interface descriptor
// must be present. The class-specific AC interface descriptor only contains the header
// descriptor.

// B.3.1 Standard AC Interface Descriptor
// The AudioControl interface has no dedicated endpoints associated with it. It uses the
// default pipe (endpoint 0) for all communication purposes. Class-specific AudioControl
// Requests are sent using the default pipe. There is no Status Interrupt endpoint provided.
	/* AC interface descriptor follows inline: */
	9,			/* sizeof(usbDescrInterface): length of descriptor in bytes */
	USBDESCR_INTERFACE,	/* descriptor type */
	0,			/* index of this interface */
	0,			/* alternate setting for this interface */
	0,			/* endpoints excl 0: number of endpoint descriptors to follow */
	1,			/* */
	1,			/* */
	0,			/* */
	0,			/* string index for interface */

// B.3.2 Class-specific AC Interface Descriptor
// The Class-specific AC interface descriptor is always headed by a Header descriptor
// that contains general information about the AudioControl interface. It contains all
// the pointers needed to describe the Audio Interface Collection, associated with the
// described audio function. Only the Header descriptor is present in this device
// because it does not contain any audio functionality as such.
	/* AC Class-Specific descriptor */
	9,			/* sizeof(usbDescrCDC_HeaderFn): length of descriptor in bytes */
	36,			/* descriptor type */
	1,			/* header functional descriptor */
	0x0, 0x01,		/* bcdADC */
	9, 0,			/* wTotalLength */
	1,			/* */
	1,			/* */

// B.4 MIDIStreaming Interface Descriptors

// B.4.1 Standard MS Interface Descriptor
	/* interface descriptor follows inline: */
	9,			/* length of descriptor in bytes */
	USBDESCR_INTERFACE,	/* descriptor type */
	1,			/* index of this interface */
	0,			/* alternate setting for this interface */
	2,			/* endpoints excl 0: number of endpoint descriptors to follow */
	1,			/* AUDIO */
	3,			/* MS */
	0,			/* unused */
	0,			/* string index for interface */

// B.4.2 Class-specific MS Interface Descriptor
	/* MS Class-Specific descriptor */
	7,			/* length of descriptor in bytes */
	36,			/* descriptor type */
	1,			/* header functional descriptor */
	0x0, 0x01,		/* bcdADC */
	65, 0,			/* wTotalLength */

// B.4.3 MIDI IN Jack Descriptor
	6,			/* bLength */
	36,			/* descriptor type */
	2,			/* MIDI_IN_JACK desc subtype */
	1,			/* EMBEDDED bJackType */
	1,			/* bJackID */
	0,			/* iJack */

	6,			/* bLength */
	36,			/* descriptor type */
	2,			/* MIDI_IN_JACK desc subtype */
	2,			/* EXTERNAL bJackType */
	2,			/* bJackID */
	0,			/* iJack */

//B.4.4 MIDI OUT Jack Descriptor
	9,			/* length of descriptor in bytes */
	36,			/* descriptor type */
	3,			/* MIDI_OUT_JACK descriptor */
	1,			/* EMBEDDED bJackType */
	3,			/* bJackID */
	1,			/* No of input pins */
	2,			/* BaSourceID */
	1,			/* BaSourcePin */
	0,			/* iJack */

	9,			/* bLength of descriptor in bytes */
	36,			/* bDescriptorType */
	3,			/* MIDI_OUT_JACK bDescriptorSubtype */
	2,			/* EXTERNAL bJackType */
	4,			/* bJackID */
	1,			/* bNrInputPins */
	1,			/* baSourceID (0) */
	1,			/* baSourcePin (0) */
	0,			/* iJack */


// B.5 Bulk OUT Endpoint Descriptors

//B.5.1 Standard Bulk OUT Endpoint Descriptor
	9,			/* bLenght */
	USBDESCR_ENDPOINT,	/* bDescriptorType = endpoint */
	0x1,			/* bEndpointAddress OUT endpoint number 1 */
	3,			/* bmAttributes: 2:Bulk, 3:Interrupt endpoint */
	8, 0,			/* wMaxPacketSize */
	10,			/* bIntervall in ms */
	0,			/* bRefresh */
	0,			/* bSyncAddress */

// B.5.2 Class-specific MS Bulk OUT Endpoint Descriptor
	5,			/* bLength of descriptor in bytes */
	37,			/* bDescriptorType */
	1,			/* bDescriptorSubtype */
	1,			/* bNumEmbMIDIJack  */
	1,			/* baAssocJackID (0) */


//B.6 Bulk IN Endpoint Descriptors

//B.6.1 Standard Bulk IN Endpoint Descriptor
	9,			/* bLenght */
	USBDESCR_ENDPOINT,	/* bDescriptorType = endpoint */
	0x81,			/* bEndpointAddress IN endpoint number 1 */
	3,			/* bmAttributes: 2: Bulk, 3: Interrupt endpoint */
	8, 0,			/* wMaxPacketSize */
	10,			/* bIntervall in ms */
	0,			/* bRefresh */
	0,			/* bSyncAddress */

// B.6.2 Class-specific MS Bulk IN Endpoint Descriptor
	5,			/* bLength of descriptor in bytes */
	37,			/* bDescriptorType */
	1,			/* bDescriptorSubtype */
	1,			/* bNumEmbMIDIJack (0) */
	3,			/* baAssocJackID (0) */
};

/* Used to return a USB Descriptor dynamically at runtime.
 * Other options are to keep USB Descriptor data in fixed-length static
 * data in RAM or FLASH, or to use the default descriptors.
 *
 * See usbconfig.h "Fine Control over USB Descriptors" for more information.
 */
uchar usbFunctionDescriptor(usbRequest_t * rq)
{
	if (rq->wValue.bytes[1] == USBDESCR_DEVICE) {
		usbMsgPtr = (uchar *) deviceDescrMIDI;
		return sizeof(deviceDescrMIDI);
	}
	else {		/* must be config descriptor */
		usbMsgPtr = (uchar *) configDescrMIDI;
		return sizeof(configDescrMIDI);
	}
}

/* Implementation taken from V-USB-MIDI Project
 * http://cryptomys.de/horo/V-USB-MIDI/index.html */
uchar usbFunctionRead(uchar *data, uchar len)
{
	// DEBUG LED
	// PORTC ^= 0x02;

	data[0] = 0;
	data[1] = 0;
	data[2] = 0;
	data[3] = 0;
	data[4] = 0;
	data[5] = 0;
	data[6] = 0;

	return 7;
}

/* This function is called when the driver receives a SETUP transaction from
 * the host which is not answered by the driver itself (in practice: class and
 * vendor requests). All control transfers start with a SETUP transaction where
 * the host communicates the parameters of the following (optional) data
 * transfer. The SETUP data is available in the 'data' parameter which can
 * (and should) be casted to 'usbRequest_t *' for a more user-friendly access
 * to parameters.
 *
 * If the SETUP indicates a control-in transfer, you should provide the
 * requested data to the driver. There are two ways to transfer this data:
 * (1) Set the global pointer 'usbMsgPtr' to the base of the static RAM data
 * block and return the length of the data in 'usbFunctionSetup()'. The driver
 * will handle the rest. Or (2) return USB_NO_MSG in 'usbFunctionSetup()'. The
 * driver will then call 'usbFunctionRead()' when data is needed. See the
 * documentation for usbFunctionRead() for details.
 *
 * If the SETUP indicates a control-out transfer, the only way to receive the
 * data from the host is through the 'usbFunctionWrite()' call. If you
 * implement this function, you must return USB_NO_MSG in 'usbFunctionSetup()'
 * to indicate that 'usbFunctionWrite()' should be used. See the documentation
 * of this function for more information. If you just want to ignore the data
 * sent by the host, return 0 in 'usbFunctionSetup()'.
 *
 * Note that calls to the functions usbFunctionRead() and usbFunctionWrite()
 * are only done if enabled by the configuration in usbconfig.h.
 */
usbMsgLen_t usbFunctionSetup(uchar data[8])
{
	/* Return 0xff to get usbFunctionWrite and usbFunctionRead called. */
	return 0xff;
}

uchar usbFunctionWrite(uchar *data, uchar len)
{
  return 1;
}

/*---------------------------------------------------------------------------*/
/* usbFunctionWriteOut                                                       */
/*                                                                           */
/* this Function is called if a MIDI Out message (from PC) arrives.          */
/*                                                                           */
/*---------------------------------------------------------------------------*/

// joel: On received of message
void usbFunctionWriteOut(uchar * midiMsg, uchar len)
{
	// The length of the message should be 4 for a note on 
	switch (module_type) {
		case ANALOG_OUTPUT:
			analog_output_device_usb_input_handler(midiMsg,len);
			break;

		case ANALOG_INPUT:
			analog_input_device_usb_input_handler(midiMsg,len);
			break;

		case DIGITAL_OUTPUT:
			digital_output_device_usb_input_handler(midiMsg,len);
			break;

		case DIGITAL_INPUT:
			digital_input_device_usb_input_handler(midiMsg,len);
			break;

		default:
			/* Do nothing. */
			break;
	}
}

/* ------------------------------------------------------------------------- */
/* ------------------------ Oscillator Calibration ------------------------- */
/* ------------------------------------------------------------------------- */

/* Calibrate the RC oscillator to 8.25 MHz. The core clock of 16.5 MHz is
 * derived from the 66 MHz peripheral clock by dividing. Our timing reference
 * is the Start Of Frame signal (a single SE0 bit) available immediately after
 * a USB RESET. We first do a binary search for the OSCCAL value and then
 * optimize this value with a neighboorhod search.
 * This algorithm may also be used to calibrate the RC oscillator directly to
 * 12 MHz (no PLL involved, can therefore be used on almost ALL AVRs), but this
 * is wide outside the spec for the OSCCAL value and the required precision for
 * the 12 MHz clock! Use the RC oscillator calibrated to 12 MHz for
 * experimental purposes only!
 */
static void calibrateOscillator(void)
{
	uchar       step = 128;
	uchar       trialValue = 0, optimumValue;
	int         x, optimumDev, targetValue = (unsigned)(1499 * (double)F_CPU / 10.5e6 + 0.5);

	/* do a binary search: */
    do {
        OSCCAL = trialValue + step;
        x = usbMeasureFrameLength();    /* proportional to current real frequency */
        if(x < targetValue)             /* frequency still too low */
            trialValue += step;
        step >>= 1;
    } while (step > 0);

    /* We have a precision of +/- 1 for optimum OSCCAL here */
    /* now do a neighborhood search for optimum value */
    optimumValue = trialValue;
    optimumDev = x; /* this is certainly far away from optimum */
    for(OSCCAL = trialValue - 1; OSCCAL <= trialValue + 1; OSCCAL++) {
        x = usbMeasureFrameLength() - targetValue;
        if(x < 0) x = -x;
        if (x < optimumDev) {
            optimumDev = x;
            optimumValue = OSCCAL;
        }
    }
    OSCCAL = optimumValue;
}
/*
Note: This calibration algorithm may try OSCCAL values of up to 192 even if
the optimum value is far below 192. It may therefore exceed the allowed clock
frequency of the CPU in low voltage designs!
You may replace this search algorithm with any other algorithm you like if
you have additional constraints such as a maximum CPU clock.
For version 5.x RC oscillators (those with a split range of 2x128 steps, e.g.
ATTiny25, ATTiny45, ATTiny85), it may be useful to search for the optimum in
both regions.
*/

void hadUsbReset(void)
{
	cli();
	calibrateOscillator();
	sei();
    eeprom_write_byte(OSCCAL_EEPROM_ADDR, OSCCAL);   /* store the calibrated value in EEPROM byte 0*/
}

void initUSB()
{
	uint8_t uCalVal;

	do {} while (!eeprom_is_ready());
    uCalVal = eeprom_read_byte(OSCCAL_EEPROM_ADDR); // calibration value from last time
	/* Check that returned calibration value is valid before setting OSCCAL. */
    if (uCalVal != 0xff) OSCCAL = uCalVal;

  /* Note about eeprom_read: As these functions modify IO registers, they are
   * known to be non-reentrant. If any of these functions are used from both,
   * standard and interrupt context, the applications must ensure proper
   * protection (e.g. by disabling interrupts before accessing them).
   * Note: It's unclear whether hadUsbReset is in an interrupt context. */

    // read module type from last time
    uint8_t stored_module_type = eeprom_read_byte(MODULE_TYPE_EEPROM_ADDR);
	/* Check that returned calibration value is valid before setting module_type. */
    if (stored_module_type != 0xff && stored_module_type != 0) {
      module_type = stored_module_type;
    }

	/* Enable watchdog timer */
    wdt_enable(WDTO_2S);

    usbInit();
    usbDeviceDisconnect();  // enforce re-enumeration, do this while interrupts are disabled!

	// fake USB disconnect for > 250 ms
	// If delay is longer than watchdog timeout, split this into smaller delays
	// with wdt_reset called in between.
	wdt_reset();
	_delay_ms(USB_DISCONNECT_DELAY_MS);
	wdt_reset();

    usbDeviceConnect();
}

/* TODO: put this in an interface header file. */
void init_modules(void) {
	switch (module_type) {
		case ANALOG_INPUT:
			init_analog_input_device();
			break;

		case ANALOG_OUTPUT:
			init_analog_output_device();
			break;

		case DIGITAL_INPUT:
			init_digital_input_device();
			break;

		case DIGITAL_OUTPUT:
			init_digital_output_device();
			break;

		case I2C_DEVICE:
			/* Not implemented yet. */
			break;

		default:
			/* Device not recognized. */
			break;
	}
}

int main()
{
	initStatusLED();
	initUSB();

	// Globally enable interrupts
	sei();

	init_modules();
	// Endless loop
	for (;;) {

		/* Regularly restart watchdog timer to prevent it from elapsing. */
		wdt_reset();
		usbPoll();
		
		if (usbInterruptIsReady()) {
			switch (module_type) {
				case ANALOG_INPUT:
					analog_input_device_main_loop(uADC);
					break;

				case ANALOG_OUTPUT:
					analog_output_device_main_loop();
					break;

				case DIGITAL_INPUT:
					digital_input_device_main_loop(uADC);
					break;

				case DIGITAL_OUTPUT:
					digital_output_device_main_loop();
					break;

				case I2C_DEVICE:
					/* Not implemented yet. */
					break;

				default:
          sendPitchBend(module_type);
				  break;
			}
		}
	}
	return 0;
}

/* Service Routines to handle timer, ADC, and changing Module Type. */

/* Modify module type. */
void update_module_type(uint8_t new_type)
{
    module_type = new_type;
    init_modules();
    // Keep module_type state in memory. TODO: Does this stay in EEPROM
    // even when I re-run micronucleus? We wouldn't want that though.
    // Unsure whether this is in interrupt context or standard context here
    cli();
    eeprom_write_byte(MODULE_TYPE_EEPROM_ADDR, module_type);
    sei();
}

uint8_t get_module_type(void)
{
  return module_type;
}

/* Handle continuous timer and blink status LED. */
ISR(TIMER1_OVF_vect)
{
	// Note: using old blink function like this causes module to not show up sometimes over USB?
	// doesn't happen if no function call ...
	static uint16_t nBlink = 0;				// Blink timer

	// For timing calibration
	if (nBlink > 0) {
		--nBlink;	// Decrease led timer counter value
	} else {
		nBlink = SECONDS_PER_BLINK * CYCLES_PER_SECOND;	// Reset blink timer counter
		PORTB ^= _BV(STATUS_LED_PORT);	// Toggle LED - this works
	}

	// Reset timer 1 counter (Only necessary if timer 1 compare match interrupt instead of
	// timer 1 overflow interrupt is used)
	 TCNT1 = 0;
}


/* Handle interrupt from ADC, which indicates it has a new value ready. */
ISR(ADC_vect)
{
	uADC = ADCH;	// Get analog input value
}
