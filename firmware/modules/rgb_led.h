#ifndef RGB_LED_H
#define RGB_LED_H

#define _CL_RED             0
#define _CL_GREEN           1
#define _CL_BLUE            2

void rgb_led_main_loop(void);
void sendColor(unsigned char red, unsigned char green, unsigned char blue);
void setColorRGB(unsigned char red, unsigned char green, unsigned char blue);
#endif