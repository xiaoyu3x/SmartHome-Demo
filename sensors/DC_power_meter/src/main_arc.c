/*
 * Copyright (c) 2016 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <zephyr.h>

#include <stdio.h>
#include <string.h>
#include <misc/printk.h>

#include <ipm.h>
#include <ipm/ipm_quark_se.h>
#include <device.h>
#include <i2c.h>
#include <display/grove_lcd.h>

/* ID of IPM channel */
#define CONSUMPTION_CHANNEL	101
#define SOLAR_CHANNEL		102

QUARK_SE_IPM_DEFINE(power_ipm, 0, QUARK_SE_IPM_OUTBOUND);

/**
 * @file Sample app using the TI INA219 through I2C.
 */

#define I2C_SLV_ADDR	0x40
#define I2C_SLV_BOARD1_ADDR	0x40
#define I2C_SLV_BOARD2_ADDR	0x41

/* The calibration value is based on components on
 * Adafruit's breakout board
 * (https://www.adafruit.com/products/904), where
 * the current sensing resistor is 0.1 ohm.
 * This enables measurements up to 16V, 5A.
 */
#define CAL_VAL		(4096)

/* With default calibration above,
 * Each current LSB is 100 uA == 0.1 mA == 0.0001 A.
 * Each power LSB is 2000 uW == 2 mW = 0.002W.
 */
#define CUR_LSB		100
#define PWR_LSB		2000

int read_reg16(struct device *i2c_dev, uint8_t reg_addr,
	       uint8_t *data, uint8_t board_addr)
{
	uint8_t wr_addr;
	struct i2c_msg msgs[2];

	/* Register address */
	wr_addr = reg_addr;

	/* Setup I2C messages */

	/* Send the address to read */
	msgs[0].buf = &wr_addr;
	msgs[0].len = 1;
	msgs[0].flags = I2C_MSG_WRITE;

	/* Read from device. RESTART as needed and STOP after this. */
	msgs[1].buf = data;
	msgs[1].len = 2;
	msgs[1].flags = I2C_MSG_READ | I2C_MSG_RESTART | I2C_MSG_STOP;

	return i2c_transfer(i2c_dev, &msgs[0], 2, board_addr);
}

int write_reg16(struct device *i2c_dev, uint8_t reg_addr,
		uint8_t *data, uint8_t board_addr)
{
	uint8_t wr_addr;
	struct i2c_msg msgs[2];

	/* Register address */
	wr_addr = reg_addr;

	/* Setup I2C messages */

	/* Send the address to read */
	msgs[0].buf = &wr_addr;
	msgs[0].len = 1;
	msgs[0].flags = I2C_MSG_WRITE;

	/* Read from device. RESTART as needed and STOP after this. */
	msgs[1].buf = data;
	msgs[1].len = 2;
	msgs[1].flags = I2C_MSG_WRITE | I2C_MSG_STOP;

	return i2c_transfer(i2c_dev, &msgs[0], 2, board_addr);
}

#define SLEEPTIME  1000
#define SLEEPTICKS (SLEEPTIME * sys_clock_ticks_per_sec / 1000)

void main(void)
{
	struct device *i2c_dev, *glcd, *ipm;
	uint8_t data[2];
	uint32_t power1, power2;

	struct nano_timer timer;
	uint32_t timer_data[2] = {0, 0};
	uint8_t set_config;
	char str[16];

	nano_timer_init(&timer, timer_data);

	// INA219 initialization
	i2c_dev = device_get_binding("I2C_0");
	if (!i2c_dev) {
		printk("I2C: INA219 boards not found.\n");
		return;
	}

	// LCD initialization
	glcd = device_get_binding(GROVE_LCD_NAME);

	if (glcd) { /* Now configure the LCD the way we want it */
		set_config = GLCD_FS_ROWS_2
				| GLCD_FS_DOT_SIZE_LITTLE
				| GLCD_FS_8BIT_MODE;

		glcd_function_set(glcd, set_config);
		set_config = GLCD_DS_DISPLAY_ON | GLCD_DS_CURSOR_ON | GLCD_DS_BLINK_ON;
		glcd_display_state_set(glcd, set_config);

		glcd_color_set(glcd, 0, 255, 0);
		glcd_cursor_pos_set(glcd, 0, 0);
	} else {
		printk("Grove LCD: Device not found.\n");
	}

	/* Initialize the IPM */
	ipm = device_get_binding("power_ipm");
	if (!ipm) {
		printk("IPM: Device not found.\n");
	}

	while (1) {
		/* Configurate the chip using default values */
		data[0] = 0x19;
		data[1] = 0xFF;
		write_reg16(i2c_dev, 0x00, data, I2C_SLV_BOARD1_ADDR);
		write_reg16(i2c_dev, 0x00, data, I2C_SLV_BOARD2_ADDR);

		/* Write the calibration value */
		data[0] = (CAL_VAL & 0xFF00) >> 8;
		data[1] = CAL_VAL & 0xFF;
		write_reg16(i2c_dev, 0x05, data, I2C_SLV_BOARD1_ADDR);
		write_reg16(i2c_dev, 0x05, data, I2C_SLV_BOARD2_ADDR);

		/* Read power on board 1 */
		read_reg16(i2c_dev, 0x03, data, I2C_SLV_BOARD1_ADDR);
		power1 = (data[0] << 8) | data[1];
		power1 *= PWR_LSB;

		/* Read power on board 2*/
		read_reg16(i2c_dev, 0x03, data, I2C_SLV_BOARD2_ADDR);
		power2 = (data[0] << 8) | data[1];
		power2 *= PWR_LSB;

		// send data over ipm to x86 side
		if (ipm) {
			if (ipm_send(ipm, 1, CONSUMPTION_CHANNEL, &power1, sizeof(power1)) ||
				ipm_send(ipm, 1, SOLAR_CHANNEL, &power2, sizeof(power2)))
			{
				printk("Failed to send sensor data over ipm\n");
			}
		}

		if (glcd) {
			glcd_clear(glcd);
			glcd_cursor_pos_set(glcd, 0, 0);
			sprintf(str, "House: %d mM", power1 / 1000);
			glcd_print(glcd, str, strlen(str));
			glcd_cursor_pos_set(glcd, 0, 1);
			sprintf(str, "Solar: %d mM", power2 / 1000);
			glcd_print(glcd, str, strlen(str));
		}

		// print out in JSON format
		printk("{\"ch-1\": %d, \"ch-2\": %d}\n", power1 / 1000, power2 / 1000);

		/* wait a while */
		nano_task_timer_start(&timer, SLEEPTICKS);
		nano_task_timer_test(&timer, TICKS_UNLIMITED);
	}
}
