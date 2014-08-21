#include "compass.h"
#include <util/delay.h>
#include "usbdrv.h"
#include "midi.h"
#include "i2c_bb.h"

void setup_compass(){
  // "The Wire library uses 7 bit addresses throughout. 
  //If you have a datasheet or sample code that uses 8 bit address, 
  //you'll want to drop the low bit (i.e. shift the value one bit to the right), 
  //yielding an address between 0 and 127."
  //HMC6352SlaveAddress = HMC6352SlaveAddress >> 1; // I know 0x42 is less than 127, but this is still required

//   Wire.begin();
	I2C_Init();
}
// http://bildr.org/2011/01/hmc6352/
// Original Code for Compass From Arduino Library
// #include <Wire.h>
// int HMC6352SlaveAddress = 0x42;
// int HMC6352ReadAddress = 0x41; //"A" in hex, A command is: 
// 
// int headingValue;
// 
// void setup(){
//   // "The Wire library uses 7 bit addresses throughout. 
//   //If you have a datasheet or sample code that uses 8 bit address, 
//   //you'll want to drop the low bit (i.e. shift the value one bit to the right), 
//   //yielding an address between 0 and 127."
//   HMC6352SlaveAddress = HMC6352SlaveAddress >> 1; // I know 0x42 is less than 127, but this is still required
// 
//   Serial.begin(9600);
//   Wire.begin();
// }
// 
// void loop(){
//   //"Get Data. Compensate and Calculate New Heading"
//   Wire.beginTransmission(HMC6352SlaveAddress);
//   Wire.send(HMC6352ReadAddress);              // The "Get Data" command
//   Wire.endTransmission();
// 
//   //time delays required by HMC6352 upon receipt of the command
//   //Get Data. Compensate and Calculate New Heading : 6ms
//   delay(6);
// 
//   Wire.requestFrom(HMC6352SlaveAddress, 2); //get the two data bytes, MSB and LSB
// 
//   //"The heading output data will be the value in tenths of degrees
//   //from zero to 3599 and provided in binary format over the two bytes."
//   byte MSB = Wire.receive();
//   byte LSB = Wire.receive();
// 
//   float headingSum = (MSB << 8) + LSB; //(MSB / LSB sum)
//   float headingInt = headingSum / 10; 
// 
//   Serial.print(headingInt);
//   Serial.println(" degrees");
// 
//   delay(100);
// }

void compass_main_loop(){
	static unsigned int delay_cnt = 0;
	unsigned char i = 0;
	
   //Use this to break up the delay so computer doesnt drop USB device
  if(delay_cnt % 50 == 0){	
	  //"Get Data. Compensate and Calculate New Heading"
	  I2C_Start();
	  i = I2C_Write(HMC6352SlaveAddress);
	  i |= I2C_Write(HMC6352ReadAddress);
	  //time delays required by HMC6352 upon receipt of the command
	  //Get Data. Compensate and Calculate New Heading : 6ms
	  _delay_ms(20);
	  //"The heading output data will be the value in tenths of degrees
	  //from zero to 3599 and provided in binary format over the two bytes."
	  I2C_Start();
	  i |= I2C_Write(HMC6352SlaveAddress | 0x1);
	  unsigned char MSB = I2C_Read(1);
	  unsigned char LSB = I2C_Read(0);
	  I2C_Stop();

	  float headingSum = (MSB << 8) + LSB; //(MSB / LSB sum)
	  float headingInt = headingSum / 10; 
  
	  sendPitchBend(((uchar)headingInt >> 1) & 0x7F);

   }
   _delay_ms(20);
	delay_cnt++;
}