#include "i2c_bb.h"
#include <util/delay.h>

//http://codinglab.blogspot.com/2008/10/i2c-on-avr-using-bit-banging.html
void busy_wait(){
	volatile int i;
	for(i = 0;i<1;i++){
		
	}
}

void I2C_WriteBit(unsigned char c)
{
    if (c > 0)
    {
        I2C_DATA_HI();
    }
    else
    {
        I2C_DATA_LO();
    }

    I2C_CLOCK_HI();
    while ((I2C_PIN & (1 << I2C_CLK)) == 0);
    _delay_us(3);

    I2C_CLOCK_LO();
    _delay_us(3);

    if (c > 0)
    {
        I2C_DATA_LO();
    }

    _delay_us(3);
}

unsigned char I2C_ReadBit()
{
    I2C_DATA_HI();

    I2C_CLOCK_HI();
    while ((I2C_PIN & (1 << I2C_CLK)) == 0);
    _delay_us(3);

    unsigned char c = I2C_PIN;

    I2C_CLOCK_LO();
    _delay_us(3);

    return (c >> I2C_DAT) & 1;
}

// Inits bitbanging port, must be called before using the functions below
//
void I2C_Init()
{
    I2C_PORT &= ~ ((1 << I2C_DAT) | (1 << I2C_CLK));

    I2C_CLOCK_HI();
    _delay_us(3);
    I2C_DATA_HI();

    _delay_us(3);
}

// Send a START Condition
//
void I2C_Start()
{
    // set both to high at the same time
    I2C_DDR &= ~ ((1 << I2C_DAT) | (1 << I2C_CLK));
    _delay_us(3);

    I2C_DATA_LO();
    _delay_us(3);

    I2C_CLOCK_LO();
    _delay_us(3);
}

// Send a STOP Condition
//
void I2C_Stop()
{
    I2C_CLOCK_HI();
    _delay_us(3);

    I2C_DATA_HI();
    _delay_us(3);
}

// write a byte to the I2C slave device
//
unsigned char I2C_Write(unsigned char c)
{
	char i;
    for (i = 0; i < 8; i++)
    {
        I2C_WriteBit(c & 128);

        c <<= 1;
    }

    return I2C_ReadBit();
    //return 0;
}


// read a byte from the I2C slave device
//
unsigned char I2C_Read(unsigned char ack)
{
    unsigned char res = 0;
	char i;
    for (i = 0; i < 8; i++)
    {
        res <<= 1;
        res |= I2C_ReadBit();
    }

    if (ack > 0)
    {
        I2C_WriteBit(0);
    }
    else
    {
        I2C_WriteBit(1);
    }

    _delay_us(3);

    return res;
}

// read multiple byte from the I2C slave device
//
void I2C_Read_Mul(unsigned int bytes, unsigned char *buf)
{
	unsigned int i;
    for (i = 0; i < bytes-1; i++)
    {
        *buf = I2C_Read(1);
        buf++;
    }
    	*buf = I2C_Read(0);
}


