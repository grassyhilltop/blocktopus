#ifndef I2C_DEVICE_H
#define I2C_DEVICE_H

#include <stdint.h>

void init_i2c_device(void);
void i2c_device_main_loop(uint8_t uADC);

#endif
