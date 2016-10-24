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

#include <device.h>
#include <adc.h>
#include <misc/byteorder.h>
#include <ipm.h>
#include <ipm/ipm_quark_se.h>
#include <misc/printk.h>
#include <misc/util.h>
#include <sensor.h>
#include <zephyr.h>

#ifdef CONFIG_GROVE_LCD_RGB
#include <display/grove_lcd.h>
#include <stdio.h>
#include <string.h>
#endif

#define ADC_DEVICE_NAME "ADC_0"
#define ADC_CHANNEL     10
#define ADC_BUFFER_SIZE 4

#define INTERVAL        1000
#define SLEEPTICKS MSEC(INTERVAL)

#define SENSOR_CHAN_UV_INDEX 99

QUARK_SE_IPM_DEFINE(ess_ipm, 0, QUARK_SE_IPM_OUTBOUND);

/* buffer for the ADC data */
static uint8_t seq_buffer[ADC_BUFFER_SIZE];

static struct adc_seq_entry sample = {
	.sampling_delay = 12,
	.channel_id = ADC_CHANNEL,
	.buffer = seq_buffer,
	.buffer_length = ADC_BUFFER_SIZE,
};

static struct adc_seq_table table = {
	.entries = &sample,
	.num_entries = 1,
};

void main(void)
{
	struct device *ipm, *bme280, *adc;
	struct sensor_value temp, press, humidity;
	uint8_t uv_index;
	struct nano_timer timer;
	uint32_t data[2] = {0, 0};
	int32_t uv_signal;
	float illuminance;

	nano_timer_init(&timer, data);

	ipm = device_get_binding("ess_ipm");
	if (ipm == NULL) {
		printk("Failed to get ESS IPM device\n");
		return;
	}

	bme280 = device_get_binding("BME280");
	if (bme280 == NULL) {
		printk("Failed to get BME280 sensor\n");
		return;
	}

	/* Initialize the ADC */
	adc = device_get_binding(ADC_DEVICE_NAME);
	if (!adc) {
		printk("ADC Controller: Device not found.\n");
		return;
	}
	adc_enable(adc);

#ifdef CONFIG_GROVE_LCD_RGB
	struct device *glcd;

	glcd = device_get_binding(GROVE_LCD_NAME);
	if (glcd == NULL) {
		printk("Failed to get Grove LCD\n");
		return;
	}

	/* configure LCD */
	glcd_function_set(glcd, GLCD_FS_ROWS_2 | GLCD_FS_DOT_SIZE_LITTLE |
			  GLCD_FS_8BIT_MODE);
	glcd_display_state_set(glcd, GLCD_DS_DISPLAY_ON);
#endif

	while (1) {
		if (adc_read(adc, &table) == 0) {
			uv_signal = (uint32_t) seq_buffer[0]
					| (uint32_t) seq_buffer[1] << 8
					| (uint32_t) seq_buffer[2] << 16
					| (uint32_t) seq_buffer[3] << 24;
			//printk("uv_signal = %d\n", uv_signal);
			illuminance = (float) uv_signal * 3.3 / 4096 * 307;
			uv_index = (uint8_t)((illuminance - 83) / 21);
			if (ipm_send(ipm, 1, SENSOR_CHAN_UV_INDEX, &uv_index, sizeof(uv_index))) {
				printk("Failed to send uv sensor data over ipm\n");
			}
			//printk("UV index = %d\n", uv_index.val1);
		}

		/* fetch sensor samples */
		if (sensor_sample_fetch(bme280)) {
			printk("Failed to fetch sample for BME280 sensor\n");
			continue;
		}

		/* read data from the sensor channels */
		if (sensor_channel_get(bme280, SENSOR_CHAN_TEMP, &temp) ||
			sensor_channel_get(bme280, SENSOR_CHAN_PRESS, &press) ||
			sensor_channel_get(bme280, SENSOR_CHAN_HUMIDITY, &humidity))
		{
			printk("Failed to read data from sensor channels for BME280\n");
			continue;
		}
		else {
			/* send sensor data to x86 core via IPM */
			if (ipm_send(ipm, 1, SENSOR_CHAN_TEMP, &temp, sizeof(temp)) ||
				ipm_send(ipm, 1, SENSOR_CHAN_PRESS, &press, sizeof(press)) ||
				ipm_send(ipm, 1, SENSOR_CHAN_HUMIDITY, &humidity, sizeof(humidity)))
			{
				printk("Failed to send sensor data over ipm\n");
			}
		}

#ifdef CONFIG_GROVE_LCD_RGB
		char row[16];

		/* clear LCD */
		memset(row, ' ', sizeof(row));
		glcd_cursor_pos_set(glcd, 0, 0);
		glcd_print(glcd, row, sizeof(row));
		glcd_cursor_pos_set(glcd, 0, 1);
		glcd_print(glcd, row, sizeof(row));

		/* display temperature on LCD */
		glcd_cursor_pos_set(glcd, 0, 0);
		sprintf(row, "T:%d.%d%cC", temp.val1,
			temp.val2/100000, 223 /* degree symbol */);
		glcd_print(glcd, row, strlen(row));

		/* display himidity on LCD */
		glcd_cursor_pos_set(glcd, 17 - strlen(row), 0);
		sprintf(row, "RH:%d%c", humidity.val1/1000,
			37 /* percent symbol */);
		glcd_print(glcd, row, strlen(row));

		/* display pressure on LCD */
		glcd_cursor_pos_set(glcd, 0, 1);
		sprintf(row, "P:%d.%02dkPa", press.val1,
		       press.val2 / 1000);
		glcd_print(glcd, row, strlen(row));
#endif

		nano_timer_start(&timer, SLEEPTICKS);
		nano_timer_test(&timer, TICKS_UNLIMITED);
	}
}
