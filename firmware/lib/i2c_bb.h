#ifndef I2C_BB_H
#define I2C_BB_H
#include <avr/io.h>
// Port for the I2C
#define I2C_DDR DDRB
#define I2C_PIN PINB
#define I2C_PORT PORTB

// Pins to be used in the bit banging
#define I2C_CLK 3
#define I2C_DAT 4

#define I2C_DATA_HI()\
I2C_DDR &= ~ (1 << I2C_DAT);\
I2C_PORT |= (1 << I2C_DAT);
#define I2C_DATA_LO()\
I2C_DDR |= (1 << I2C_DAT);\
I2C_PORT &= ~ (1 << I2C_DAT);

#define I2C_CLOCK_HI()\
I2C_DDR &= ~ (1 << I2C_CLK);\
I2C_PORT |= (1 << I2C_CLK);
#define I2C_CLOCK_LO()\
I2C_DDR |= (1 << I2C_CLK);\
I2C_PORT &= ~ (1 << I2C_CLK);

void I2C_Init();
void I2C_Start();
void I2C_Stop();
unsigned char I2C_Write(unsigned char c);
unsigned char I2C_Read(unsigned char ack);
void I2C_WriteBit(unsigned char c);
unsigned char I2C_ReadBit(void);

#endif