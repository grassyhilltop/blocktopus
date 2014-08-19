/*
 * main.c
 *
 *  Created on: June , 2014
 *      Author: Joel  ( modified from Baum's original code )
 */
#include "main.h"
//#include "i2cmaster/i2cmaster.h"
#include "lib/hardware.h"
#include "lib/midi.h"
#include "lib/i2c_bb.h"
#include "config.h"
#ifdef INCLUDE_BUTTON_FW
	#include "modules/button.h"
#endif
#ifdef INCLUDE_KNOB_FW
	#include "modules/knob.h"
#endif
#ifdef INCLUDE_OUTPUT_FW
	#include "modules/output.h"
#endif
#ifdef INCLUDE_RGB_LED_FW
	#include "modules/output.h"
#endif
#include <avr/io.h>
#include <avr/interrupt.h>
#include <avr/sleep.h>
#include <avr/pgmspace.h>
#include <avr/wdt.h>
#include <avr/eeprom.h>
#include <util/delay.h>
#include "usbdrv/usbdrv.h"

#define BLINK_TIME 			200

#define MMA7660_ADDR  0x4c

#define MMA7660_X     0x00
#define MMA7660_Y     0x01
#define MMA7660_Z     0x02
#define MMA7660_TILT  0x03
#define MMA7660_SRST  0x04
#define MMA7660_SPCNT 0x05
#define MMA7660_INTSU 0x06
#define MMA7660_MODE  0x07
	#define MMA7660_STAND_BY 0x00
	#define MMA7660_ACTIVE	 0x01	
#define MMA7660_SR    0x08		//sample rate register
	#define AUTO_SLEEP_120	0X00//120 sample per second
	#define AUTO_SLEEP_64	0X01
	#define AUTO_SLEEP_32	0X02
	#define AUTO_SLEEP_16	0X03
	#define AUTO_SLEEP_8	0X04
	#define AUTO_SLEEP_4	0X05
	#define AUTO_SLEEP_2	0X06
	#define AUTO_SLEEP_1	0X07
#define MMA7660_PDET  0x09
#define MMA7660_PD    0x0A

unsigned char uADC = 0;		// Analog value
int nBlink = 0;				// Blink timer
volatile unsigned int module_type = MODULE_TYPE;

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


/* ------------------------------------------------------------------------- */
/* ----------------------------- USB interface ----------------------------- */
/* ------------------------------------------------------------------------- */

uchar usbFunctionSetup(uchar data[8])
{
	return 0xff;
}


/*---------------------------------------------------------------------------*/
/* usbFunctionRead                                                           */
/*---------------------------------------------------------------------------*/

uchar usbFunctionRead(uchar * data, uchar len)
{
	data[0] = 0;
	data[1] = 0;
	data[2] = 0;
	data[3] = 0;
	data[4] = 0;
	data[5] = 0;
	data[6] = 0;

	return 7;
}


/*---------------------------------------------------------------------------*/
/* usbFunctionWrite                                                          */
/*---------------------------------------------------------------------------*/

uchar usbFunctionWrite(uchar * data, uchar len)
{
	return 1;
}


void blink();


/*---------------------------------------------------------------------------*/
/* usbFunctionWriteOut                                                       */
/*                                                                           */
/* this Function is called if a MIDI Out message (from PC) arrives.          */
/*                                                                           */
/*---------------------------------------------------------------------------*/

// joel: On received of message
void usbFunctionWriteOut(uchar * midiMsg, uchar len)
{
	// blink();

	// The length of the message should be 4 for a note on 
#ifdef INCLUDE_OUTPUT_FW
	if (module_type == OUTPUT){
		output_usb_input_handler(midiMsg,len);
	}
#endif
	
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
    eeprom_write_byte(0, OSCCAL);   /* store the calibrated value in EEPROM byte 0*/
}


void blink()
{
	nBlink = BLINK_TIME;			// Set blink timer counter
	PORTB |= _BV(STATUS_LED_PORT);	// Switch status LED on
}


void initOutputPort(){

	DDRB = _BV(OUTPUT_PORT); 	// LED pin = output
	DDRB |= _BV(DDB4); 	// LED pin = output
	PORTB |= _BV(DDB3);	
	PORTB |= _BV(DDB4);	
}


void initStatusLED()
{
	DDRB = _BV(STATUS_LED_PORT); 	// LED pin = output

	// Timer 1 prescaler (blink counter speed):
	TCCR1 = _BV(CS12);								// 1:8
	// TCCR1 = _BV(CS11) | _BV(CS12);				// 1:32
	// TCCR1 = _BV(CS10) | _BV(CS11) | _BV(CS12);	// 1:64
	// TCCR1 = _BV(CS10) | _BV(CS13);				// 1:256
	// TCCR1 = _BV(CS10) | _BV(CS11) | _BV(CS13);	// 1:1024

	TIMSK = _BV(TOIE1); // Enable timer 1 overflow interrupt
	// TIMSK = _BV(OCIE1A);	// Enable timer 1 compare match A interrupt

	// Set timer 1 output compare register A.
	// OCR1A = 127;
}


void initAnalogInput()
{
	ADMUX = _BV(ADLAR) | _BV(MUX1) | _BV(MUX0);		// Left adjust result (ADCH is result with 8 bit resolution), Vcc is reference voltage, sample port ADC3

	// Enable ADC,
	// start conversion,
	// ADC auto triger enable (starts "free running mode" because ADTS0 - 2 in ADCSRB are set to 0 at this point),
	// acivate ADC conversion complete interrupt,
	// set prescaler to 128
	ADCSRA = _BV(ADEN) | _BV(ADSC) | _BV(ADATE) | _BV(ADIE) | _BV(ADPS0)| _BV(ADPS1) | _BV(ADPS2);
}


void initUSB()
{
	uchar uCalVal, i;

	do {} while (!eeprom_is_ready());
    uCalVal = eeprom_read_byte(0); // calibration value from last time
    if (uCalVal != 0xff) OSCCAL = uCalVal;

    wdt_enable(WDTO_2S);

    usbInit();
    usbDeviceDisconnect();  // enforce re-enumeration, do this while interrupts are disabled!
    i = 0;
    while (--i) {             // fake USB disconnect for > 250 ms
        wdt_reset();
        _delay_ms(1);
    }
    usbDeviceConnect();
}

void write(unsigned char _register, unsigned char _data)
{
//    Wire.begin();
	I2C_Start();
    //Wire.beginTransmission(MMA7660_ADDR);
    I2C_Write(MMA7660_ADDR | 0x2);
    //Wire.write(_register);
    I2C_Write(_register);
    //Wire.write(_data);
    I2C_Write(_data);
    //Wire.endTransmission();
    I2C_Stop();
}

unsigned char read(unsigned char _register)
{
    uint8_t data_read;
//     Wire.begin();
	I2C_Start();
//    Wire.beginTransmission(MMA7660_ADDR);
    I2C_Write(MMA7660_ADDR);
//     Wire.write(_register);
    I2C_Write(_register);
//    Wire.endTransmission();
    I2C_Stop();
//     Wire.beginTransmission(MMA7660_ADDR);
	I2C_Start();
//     Wire.requestFrom(MMA7660_ADDR,1);
    data_read = I2C_Read(MMA7660_ADDR);
    data_read = I2C_Read(MMA7660_ADDR);
    data_read = I2C_Read(MMA7660_ADDR);
//     while(Wire.available())
//     {
//         data_read = Wire.read();
//     }
//     Wire.endTransmission();
    I2C_Stop();
    return data_read;
}

void setMode(uint8_t mode)
{
    write(MMA7660_MODE,mode);
}

void setSampleRate(uint8_t rate)
{
    write(MMA7660_SR,rate);
}

void init()
{
    setMode(MMA7660_STAND_BY);
    setSampleRate(AUTO_SLEEP_120);
    setMode(MMA7660_ACTIVE);
}

unsigned char getXYZ_new(int8_t *x,int8_t *y,int8_t *z)
{
	unsigned char val[3];
    int count = 0;
    val[0] = val[1] = val[2] = 64;
//     val[0] = read(MMA7660_ADDR);
// 	val[1] = read(MMA7660_ADDR);
	val[2] = read(MMA7660_ADDR);

     *x = ((char)(val[0]<<2))/4;
     *y = ((char)(val[1]<<2))/4;
     *z = ((char)(val[2]<<2))/4;
     
	return 1;
}

/*Function: Get the contents of the registers in the MMA7660*/
/*          so as to calculate the acceleration.            */
// unsigned char getXYZ(int8_t *x,int8_t *y,int8_t *z)
// {
//     unsigned char val[3];
//     int count = 0;
//     val[0] = val[1] = val[2] = 64;
//     
//     long timer1 = millis();
//     long timer2 = 0;
//     
//     while(Wire.available() > 0)
//     {
//         timer2 = millis();
//         if((timer2-timer1)>500)
//         {
//             return 0;
//         }
//     }
// 
//     //read();
//     //requestFrom(MMA7660_ADDR,3);
// 
//     timer1 = millis();
//     while(Wire.available())
//     {
//     
//         if(count < 3)
//         {
// 
//             timer1 = millis();
//             while ( val[count] > 63 )  // reload the damn thing it is bad
//             {
//                 val[count] = Wire.read();
// 
//                 timer2 = millis();
//                 if((timer2-timer1)>50)
//                 {
//                     return 0;
//                 }
// 
//             }
//         }
// 
//         count++;
//         
//         timer2 = millis();
//         
//         if((timer2-timer1)>500)
//         {
//             return 0;
//         }
// 
//     }
//     
//     *x = ((char)(val[0]<<2))/4;
//     *y = ((char)(val[1]<<2))/4;
//     *z = ((char)(val[2]<<2))/4;
//     
//     return 1;
// }


unsigned char getAcceleration(float *ax,float *ay,float *az)
{
    int8_t x,y,z;
    
    if(!getXYZ_new(&x, &y, &z))return 0;
    *ax = x/21.00;
    *ay = y/21.00;
    *az = z/21.00;
    
    return 1;
    
}

int main()
{
	int nADCOld = -1;
	//int i = 0;
	int8_t x=0,y=0,z=0;
	
    initStatusLED();
	
//Setup PB3 as ADC unless this is an output
 	if( module_type != OUTPUT){
 		initAnalogInput();	
 	} 
 	else {
 		initOutputPort();
  	}
 	initUSB();
// Globally enable interrupts
 	sei();
 	
 	I2C_Init();
 	init();
	// Endless loop
	// joel here is where there is a loop
	for (;;) {
		x=0,y=0,z=0;
		wdt_reset();
		usbPoll();
		
		//I2C_Start();
		//setColorRGB(0xff,0x00,0xff);
		//I2C_Stop();
		
		getXYZ_new(&x, &y, &z);
// 		sendPitchBend((uchar)x);
// 		sendPitchBend((uchar)y);
//		if( x > 0 )
		sendPitchBend((uchar)y >> 1);
		
		if (usbInterruptIsReady()) {
			// js : bug here need to check old data value
			// e.g. if ( (uADC >> 1) != (nADCOld >> 1) ) // just look at 7 bits
			// if ( (uADC >> 1) != (nADCOld >> 1) ) {
			if (uADC != nADCOld && module_type != OUTPUT) { // if we got a new sensor value
				
				// Status LED on send new message
				// blink();
				nADCOld = uADC;
			}
			
 			//PORTB |= _BV(DDB4);
 			//PORTB |= _BV(DDB3);
			
#ifdef INCLUDE_OUTPUT_FW
// 			if (module_type == OUTPUT) {
//  				output_main_loop();
// 			}
#endif
			// ------------- SENDING PITCH BEND DATA
#ifdef INCLUDE_KNOB_FW
			if (module_type == KNOB) {
				knob_main_loop(uADC);
			}
#endif

			// ------------- SENDING NOTE ON/OFF
#ifdef INCLUDE_BUTTON_FW
			if (module_type == BUTTON) {
				button_main_loop(uADC);
			}
#endif

				
		} //if usbInterruptIsReady
	} // for (;;)

	return 0;
}


// ISR(TIMER1_COMPA_vect)
ISR(TIMER1_OVF_vect)
{
	//if (nBlink) {
	//	--nBlink;										// Decrease led timer counter value
	//	if (!nBlink) PORTB &= ~_BV(STATUS_LED_PORT);	// If timer counter has reached 0, switch status led off.
	//}

	// Reset timer 1 counter (Only necessary if timer 1 compare match interrupt instead of
	// timer 1 overflow interrupt is used)
	// TCNT1 = 0;
	//if (module_type == OUTPUT) {
	//	output_timer_isr();
	//}
}


ISR(ADC_vect)
{
	uADC = ADCH;	// Get analog input value
}
