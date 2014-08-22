#include "accelerometer.h"
#include "i2c_bb.h"
#include <util/delay.h>
#include "midi.h"

static unsigned char read(unsigned char _register);
static void write(unsigned char _register, unsigned char _data);
static void setMode(unsigned char mode);
static void setSampleRate(unsigned char rate);
static unsigned char sixb_to_eightb(unsigned char sixb);

//    Wire.begin();
//    Wire.beginTransmission(MMA7660_ADDR);
// 	  I2C_Write(MMA7660_ADDR);
//    Wire.write(_register);
//    I2C_Write(_register);
//    Wire.endTransmission();
//    Wire.beginTransmission(MMA7660_ADDR);
//    I2C_Write(MMA7660_ADDR | 0x1);
//    Wire.requestFrom(MMA7660_ADDR,1);
//    while(Wire.available())
//     {
//         data_read = Wire.read();
//     }
//    Wire.endTransmission();

void read_mul(unsigned char _register,unsigned int bytes, unsigned char *buf)
{
	unsigned char ret = 0;

 	I2C_Start();
    ret = I2C_Write(MMA7660_ADDR);
    ret |= I2C_Write(_register);

	I2C_Start();
    ret |= I2C_Write(MMA7660_ADDR + 0x1);
    I2C_Read_Mul(bytes,buf);
    I2C_Stop();
     
//		For Error detection
//      if(ret)
//     		sendPitchBend((uchar)0x0a >> 1);
}

	
unsigned char read(unsigned char _register)
{
	unsigned char ret = 0;
	unsigned char data_read = 0x00;

 	I2C_Start();
    ret = I2C_Write(MMA7660_ADDR);
    ret |= I2C_Write(_register);

	I2C_Start();
    ret |= I2C_Write(MMA7660_ADDR + 0x1);
    data_read = I2C_Read(0x0);
    I2C_Stop();
     
//		For Error detection
//      if(ret)
//     		sendPitchBend((uchar)0x0a >> 1);
    	
    return data_read;
}

static void write(unsigned char _register, unsigned char _data)
{
	unsigned char ret = 1;
	I2C_Start();
    ret = I2C_Write(MMA7660_ADDR);
    ret |= I2C_Write(_register);
    ret |= I2C_Write(_data);
    I2C_Stop();
    
//		For Error detection
//      if(ret)
//      	sendPitchBend((uchar)0x03 >> 1);
}

static void setMode(unsigned char mode)
{
    write(MMA7660_MODE,mode);
}

static void setSampleRate(unsigned char rate)
{
    write(MMA7660_SR,rate);
}

void init_for_test_accelerometer(void)
{
	setMode(MMA7660_STAND_BY);
    setMode(MMA7660_TEST);
}

void init_accelerometer(void)
{
	setMode(MMA7660_STAND_BY);
	setSampleRate(AUTO_SLEEP_120);
	setMode(MMA7660_ACTIVE);
}

unsigned char sixb_to_eightb(unsigned char sixb){
	unsigned char eightb = 0x00;
	eightb = sixb & 0b00011111;
	eightb += 32;
	return eightb;
}

unsigned char testX(unsigned char *x){
	unsigned char val=0;
	static unsigned char count = 0;
     
	count++;
    write(0x00,count);
    _delay_ms(50);
 
  	val = read(0x0);
  	return sixb_to_eightb(val);    
}

unsigned char getX(unsigned char *x)
{
	unsigned char val = 64;

  	val = read(MMA7660_X);
   	while ( val > 63 ){
   		val = read(MMA7660_X);
   	}

    *x = ((char)(val<<2))/4;
     
	return sixb_to_eightb(val);
}


unsigned char getY(unsigned char *y)
{
	unsigned char val = 64;

  	val = read(MMA7660_Y);
   	while ( val > 63 ){
   		val = read(MMA7660_Y);
   	}

    *y = ((char)(val<<2))/4;
     
	return sixb_to_eightb(val);
}

unsigned char getZ(unsigned char *z)
{
	unsigned char val = 64;

  	val = read(MMA7660_Z);
   	while ( val > 63 ){
   		val = read(MMA7660_Z);
   	}

    *z = ((char)(val<<2))/4;
     
	return sixb_to_eightb(val);
}

void getXYZ(unsigned char *buf)
{
	int i;
	int num_reg = 3;
	read_mul(MMA7660_X, num_reg,buf);
	for(i=0;i<num_reg;i++){
		buf[i]=sixb_to_eightb(buf[i]);
	}
}

void accelerometer_main_loop(){
	static unsigned char val[3];
	//val[0]=val[1]=val[2]=64;
	static unsigned int delay_cnt = 0;
	
	if(delay_cnt % 5 == 0){
		getXYZ(val);
// 		sendPitchBend(val[0]);
// 		_delay_ms(5);
//  		sendPitchBend(val[1]);
// 		_delay_ms(5);
		sendPitchBend(val[2]);
// 		_delay_ms(5);
	}
	
	delay_cnt++;
	_delay_ms(20);
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


// unsigned char getAcceleration(float *ax,float *ay,float *az)
// {
//     int8_t x,y,z;
//     
//     if(!getXYZ_new(&x, &y, &z))return 0;
//     *ax = x/21.00;
//     *ay = y/21.00;
//     *az = z/21.00;
//     
//     return 1;
// }
