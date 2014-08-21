#ifndef COMPASS_H
#define COMPASS_H

#define HMC6352SlaveAddress  0x42
#define HMC6352ReadAddress  0x41 //"A" in hex, A command is: 

void compass_main_loop(void);
#endif