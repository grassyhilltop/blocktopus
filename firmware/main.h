#ifndef MAIN_H
#define MAIN_H

#include <stdint.h>

void update_module_type(uint8_t module_type);
uint8_t get_module_type(void);
void update_module_name(uint8_t *name, uint8_t name_len);
uint8_t get_module_name(uint8_t *buf, uint8_t buf_len);
void triggerSysExMsgSend(void);

#endif
