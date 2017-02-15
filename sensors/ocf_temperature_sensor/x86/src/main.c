/*
// Copyright (c) 2016 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
*/

#include <oc_api.h>

#include <sections.h>
#include <string.h>
#include <zephyr.h>
#include <device.h>
#include <ipm.h>
#include <ipm/ipm_quark_se.h>
#include <misc/byteorder.h>
#include <misc/printk.h>
#include <sensor.h>

QUARK_SE_IPM_DEFINE(temp_ipm, 0, QUARK_SE_IPM_INBOUND);

static struct k_sem block;
static double temp;
enum {C, F, K};
static const char *tempUnit[] = {"C", "F", "K"};
static const char *tempRange[] = {"-40,125", "-40, 257", "233.15,398.15"};

static void set_device_custom_property(void *data)
{
	(void)data;
	oc_set_custom_device_property(purpose, "thermostat");
}

static int app_init(void)
{
	int ret = oc_init_platform("Intel", NULL, NULL);
	ret |= oc_add_device("/oic/d", "oic.d.thermostat",
				"Kishen's thermostat", "1.0", "1.0",
				set_device_custom_property, NULL);
	return ret;
}

static void get_temperature(oc_request_t *request,
			    oc_interface_mask_t interface,
			    void *user_data)
{
	(void)user_data;
	PRINT("GET_temperature:\n");
	char *requestUnit = 0;
	double resTemp;
	int index;

	int ret = oc_get_query_value(request, "units", &requestUnit);
	if (ret != -1) {
		if (strcmp(requestUnit, tempUnit[C]) == 0) {
			resTemp = temp;
			index = C;
		}
		else if (strcmp(requestUnit, tempUnit[F]) == 0) {
			resTemp = temp * 1.8 + 32.0;
			index = F;
		}
		else if (strcmp(requestUnit, tempUnit[K]) == 0) {
			resTemp = temp + 273.15;
			index = K;
		}
		else {
			oc_ignore_request(request);
			return;
		}
	}
	else {
		// fallback to default Fahrenheit unit
		resTemp = temp * 1.8 + 32.0;
		index = F;
	}

	oc_rep_start_root_object();
	switch (interface) {
	case OC_IF_BASELINE:
		oc_process_baseline_interface(request->resource);
	case OC_IF_R:
		oc_rep_set_double(root, temperature, resTemp);
		oc_rep_set_text_string(root, units, tempUnit[index]);
		oc_rep_set_text_string(root, range, tempRange[index]);
		break;
	default:
		break;
	}
	oc_rep_end_root_object();
	oc_send_response(request, OC_STATUS_OK);
	PRINT("Temperature %d\n", temp);
}

static void register_resources(void)
{
	oc_resource_t *res = oc_new_resource("/a/temperature", 1, 0);
	oc_resource_bind_resource_type(res, "oic.r.temperature");
	oc_resource_bind_resource_interface(res, OC_IF_R);
	oc_resource_set_default_interface(res, OC_IF_R);
	oc_resource_set_discoverable(res, true);
	oc_resource_set_periodic_observable(res, 1);
	oc_resource_set_request_handler(res, OC_GET, get_temperature, NULL);
	oc_add_resource(res);
}

static void signal_event_loop(void)
{
	k_sem_give(&block);
}

static void sensor_ipm_callback(void *context, uint32_t id, volatile void *data)
{
	volatile struct sensor_value *val;
	switch (id) {
        case SENSOR_CHAN_TEMP:
		val = data;
		temp = sensor_value_to_double((struct sensor_value *)val);
		break;
	default:
		break;
        }
}

void main(void)
{
	struct device *ipm;
	ipm = device_get_binding("temp_ipm");
	if (ipm == NULL) {
		printk("Failed to get IPM device\n");
	}
	else {
		ipm_register_callback(ipm, sensor_ipm_callback, NULL);
		ipm_set_enabled(ipm, 1);
	}

	static const oc_handler_t handler = {.init = app_init,
			.signal_event_loop = signal_event_loop,
			.register_resources = register_resources };

	k_sem_init(&block, 0, 1);

	if (oc_main_init(&handler) < 0) {
		printk("Failed to initialize OC server\n");
		return;
	}

	oc_clock_time_t next_event;

	while (true) {
		next_event = oc_main_poll();
		if (next_event == 0) {
			next_event = K_FOREVER;
		}
		else {
			next_event -= oc_clock_time();
		}
		k_sem_take(&block, next_event);
	}

	oc_main_shutdown();
}
