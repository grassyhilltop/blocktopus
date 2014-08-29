#include "rgb_led.h"
#include "i2c_bb.h"

static unsigned char red = 0x00;
static unsigned char green = 0x03;
static unsigned char blue = 0xFF;

void setup_rgb_led(void){
	I2C_Init();
}

void rgb_led_main_loop()
{
		I2C_Start();
		setColorRGB(red,green,blue);
		I2C_Stop();
}

void sendColor(unsigned char red, unsigned char green, unsigned char blue)
{
    // Start by sending a byte with the format "1 1 /B7 /B6 /G7 /G6 /R7 /R6"
    unsigned char prefix = 0b11000000;
    
    if ((blue & 0x80) == 0)     prefix|= 0b00100000;
    if ((blue & 0x40) == 0)     prefix|= 0b00010000; 
    if ((green & 0x80) == 0)    prefix|= 0b00001000;
    if ((green & 0x40) == 0)    prefix|= 0b00000100;
    if ((red & 0x80) == 0)      prefix|= 0b00000010;
    if ((red & 0x40) == 0)      prefix|= 0b00000001;
    I2C_Write_No_Ack(prefix);
        
    // Now must send the 3 colors
    I2C_Write_No_Ack(blue);
    I2C_Write_No_Ack(green);
    I2C_Write_No_Ack(red);
}



void setColorRGB(unsigned char red, unsigned char green, unsigned char blue)
{
    // Send data frame prefix (32x "0")
    I2C_Write_No_Ack(0x00);
    I2C_Write_No_Ack(0x00);
    I2C_Write_No_Ack(0x00);
    I2C_Write_No_Ack(0x00);
    
     
	sendColor(red, green, blue);

    // Terminate data frame (32x "0")
    I2C_Write_No_Ack(0x00);
    I2C_Write_No_Ack(0x00);
    I2C_Write_No_Ack(0x00);
    I2C_Write_No_Ack(0x00);
}

//Assume that messages to the RGB LED come in sets of 3. First message is for R, Second
//is for G, Third is for B
void rgb_led_usb_input_handler(unsigned char * midiMsg, unsigned char len){
	static unsigned int rgb = 0;
	
	switch(rgb % 3){
		case _CL_RED:
			red = midiMsg[3];
			break;
		case _CL_BLUE:
			blue = midiMsg[3];
			break;
		case _CL_GREEN:
			green = midiMsg[3];
			break;
		default:
			red = midiMsg[3];
	}
	
	rgb++;
}