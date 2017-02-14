/*
 * Copyright (c) 2016 Intel Corporation
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include <zephyr.h>
#include <init.h>
#include <stdio.h>
#include <sensor.h>
#include <misc/byteorder.h>
#include <ipm.h>
#include <ipm/ipm_quark_se.h>
#include <misc/printk.h>
#include <misc/util.h>

#define SLEEP_TIME	1000

QUARK_SE_IPM_DEFINE(temp_ipm, 0, QUARK_SE_IPM_OUTBOUND);

void main(void)
{
	struct device *ipm, *sensor;
	struct sensor_value temp;

	ipm = device_get_binding("temp_ipm");
	if (ipm == NULL) {
		printf("Failed to get IPM device\n");
		return;
	}

	sensor = device_get_binding("GROVE_TEMPERATURE_SENSOR");
	if (sensor == NULL) {
		printf("Sensor device not found.\n");
		return;
	}

	while (1) {
		if (sensor_sample_fetch(sensor)) {
			printf("Failed to fetch data from the temperature sensor\n");
		}

		if (sensor_channel_get(sensor, SENSOR_CHAN_TEMP, &temp)) {
			printf("Failed to read data from the temperature sensor channel\n");
			continue;
		}
		else {
			if (ipm_send(ipm, 1, SENSOR_CHAN_TEMP, &temp, sizeof(temp))) {
				printf("Failed to send temperature data over ipm\n");
			}
			printf("Temperature: %.2f C\n", sensor_value_to_double(&temp));
		}

		k_sleep(SLEEP_TIME);
	}
}
