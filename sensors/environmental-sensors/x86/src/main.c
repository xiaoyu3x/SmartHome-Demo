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

#include <bluetooth/bluetooth.h>
#include <bluetooth/hci.h>
#include <bluetooth/conn.h>
#include <bluetooth/uuid.h>
#include <bluetooth/gatt.h>
#include <device.h>
#include <ipm.h>
#include <ipm/ipm_quark_se.h>
#include <misc/byteorder.h>
#include <misc/printk.h>
#include <sensor.h>
#include <zephyr.h>

#define DEVICE_NAME			"Zephyr Environmental Sensor"
#define DEVICE_NAME_LEN			(sizeof(DEVICE_NAME) - 1)
#define TEMPERATURE_CUD			"Temperature"
#define HUMIDITY_CUD			"Humidity"
#define PRESSURE_CUD			"Pressure"
#define UV_INDEX_CUD			"UV Index"
#define SENSOR_CHAN_UV_INDEX		99

/* Interval between notifications (second) */
#define INTERVAL	1

QUARK_SE_IPM_DEFINE(ess_ipm, 0, QUARK_SE_IPM_INBOUND);

static int16_t temp_value;
static uint16_t humidity_value;
static uint32_t pressure_value;
static uint16_t uv_index_value;
static uint8_t ccc_value;

static struct bt_gatt_ccc_cfg temp_ccc_cfg[CONFIG_BLUETOOTH_MAX_PAIRED] = {};
static struct bt_gatt_ccc_cfg humidity_ccc_cfg[CONFIG_BLUETOOTH_MAX_PAIRED] = {};
static struct bt_gatt_ccc_cfg pressure_ccc_cfg[CONFIG_BLUETOOTH_MAX_PAIRED] = {};
static struct bt_gatt_ccc_cfg uv_index_ccc_cfg[CONFIG_BLUETOOTH_MAX_PAIRED] = {};
struct bt_conn *default_conn;

static void sensor_ccc_cfg_changed(uint16_t value)
{
        ccc_value = value;;
}

static ssize_t read_u16(struct bt_conn *conn, const struct bt_gatt_attr *attr,
			void *buf, uint16_t len, uint16_t offset)
{
	const uint16_t *u16 = attr->user_data;
	uint16_t value = sys_cpu_to_le16(*u16);

	return bt_gatt_attr_read(conn, attr, buf, len, offset, &value,
				 sizeof(value));
}

static ssize_t read_u32(struct bt_conn *conn, const struct bt_gatt_attr *attr,
			void *buf, uint16_t len, uint16_t offset)
{
	const uint32_t *u32 = attr->user_data;
	uint32_t value = sys_cpu_to_le32(*u32);

	return bt_gatt_attr_read(conn, attr, buf, len, offset, &value,
				 sizeof(value));
}

static struct bt_gatt_attr attrs[] = {
	BT_GATT_PRIMARY_SERVICE(BT_UUID_ESS),

	BT_GATT_CHARACTERISTIC(BT_UUID_TEMPERATURE,
				BT_GATT_CHRC_READ | BT_GATT_CHRC_NOTIFY),
	BT_GATT_DESCRIPTOR(BT_UUID_TEMPERATURE, BT_GATT_PERM_READ,
				read_u16, NULL, &temp_value),
	BT_GATT_CUD(TEMPERATURE_CUD, BT_GATT_PERM_READ),
	BT_GATT_CCC(temp_ccc_cfg, sensor_ccc_cfg_changed),

	BT_GATT_CHARACTERISTIC(BT_UUID_HUMIDITY,
				BT_GATT_CHRC_READ | BT_GATT_CHRC_NOTIFY),
	BT_GATT_DESCRIPTOR(BT_UUID_HUMIDITY, BT_GATT_PERM_READ,
				read_u16, NULL, &humidity_value),
	BT_GATT_CUD(HUMIDITY_CUD, BT_GATT_PERM_READ),
	BT_GATT_CCC(humidity_ccc_cfg, sensor_ccc_cfg_changed),

	BT_GATT_CHARACTERISTIC(BT_UUID_PRESSURE,
				BT_GATT_CHRC_READ | BT_GATT_CHRC_NOTIFY),
	BT_GATT_DESCRIPTOR(BT_UUID_PRESSURE, BT_GATT_PERM_READ,
				read_u32, NULL, &pressure_value),
	BT_GATT_CUD(PRESSURE_CUD, BT_GATT_PERM_READ),
	BT_GATT_CCC(pressure_ccc_cfg, sensor_ccc_cfg_changed),

	BT_GATT_CHARACTERISTIC(BT_UUID_UV_INDEX,
				BT_GATT_CHRC_READ | BT_GATT_CHRC_NOTIFY),
	BT_GATT_DESCRIPTOR(BT_UUID_UV_INDEX, BT_GATT_PERM_READ,
				read_u16, NULL, &uv_index_value),
	BT_GATT_CUD(UV_INDEX_CUD, BT_GATT_PERM_READ),
	BT_GATT_CCC(uv_index_ccc_cfg, sensor_ccc_cfg_changed)
};

static void connected(struct bt_conn *conn, uint8_t err)
{
	if (err) {
		printk("Connection failed (err %u)\n", err);
	} else {
		default_conn = bt_conn_ref(conn);
		printk("Connected\n");
	}
}

static void disconnected(struct bt_conn *conn, uint8_t reason)
{
	printk("Disconnected (reason %u)\n", reason);

	if (default_conn) {
		bt_conn_unref(default_conn);
		default_conn = NULL;
	}
}

static struct bt_conn_cb conn_callbacks = {
	.connected = connected,
	.disconnected = disconnected,
};

static const struct bt_data ad[] = {
	BT_DATA_BYTES(BT_DATA_FLAGS, (BT_LE_AD_GENERAL | BT_LE_AD_NO_BREDR)),
	BT_DATA_BYTES(BT_DATA_UUID16_ALL, 0x1a, 0x18)
};

static struct bt_data sd[] = {
	BT_DATA(BT_DATA_NAME_COMPLETE, DEVICE_NAME, DEVICE_NAME_LEN)
};

static void bt_ready(int err)
{
	if (err) {
		printk("Bluetooth init failed (err %d)\n", err);
		return;
	}

	bt_gatt_register(attrs, ARRAY_SIZE(attrs));

	err = bt_le_adv_start(BT_LE_ADV_CONN, ad, ARRAY_SIZE(ad),
			      sd, ARRAY_SIZE(sd));
	if (err) {
		printk("Advertising failed to start (err %d)\n", err);
		return;
	}
}

static void auth_cancel(struct bt_conn *conn)
{
	char addr[BT_ADDR_LE_STR_LEN];

	bt_addr_le_to_str(bt_conn_get_dst(conn), addr, sizeof(addr));

	printk("Pairing cancelled: %s\n", addr);
}

static struct bt_conn_auth_cb auth_cb_display = {
	.cancel = auth_cancel,
};

static void sensor_ipm_callback(void *context, uint32_t id, volatile void *data)
{
	volatile struct sensor_value *val;
	volatile uint8_t uv_val;

	switch (id) {
	case SENSOR_CHAN_TEMP:
		/* resolution of 0.01 degrees Celsius */
		val = data;
		temp_value = val->val1 * 100 + val->val2 / 10000;
		break;
	case SENSOR_CHAN_HUMIDITY:
		/* resolution of 0.01 percent */
		val = data;
		humidity_value = val->val1 / 10;
		break;
	case SENSOR_CHAN_PRESS:
		/* resolution of 0.1 Pa */
		val = data;
		pressure_value = val->val1 * 10000 + val->val2 / 100;
		break;
	case SENSOR_CHAN_UV_INDEX:
		uv_val = *(volatile uint8_t *) data;
		uv_index_value = (uint16_t) uv_val;
		break;
	default:
		break;
	}
	/* Note: sending too many notifications here may cause
	** "No buffer available to send notification" error
	*/
}

void main(void)
{
	struct device *ipm;
	int rc;
	uint16_t value16;
	uint32_t value32;

	rc = bt_enable(bt_ready);
	if (rc) {
		printk("Bluetooth init failed (err %d)\n", rc);
		return;
	}
	bt_conn_cb_register(&conn_callbacks);
	bt_conn_auth_cb_register(&auth_cb_display);

	ipm = device_get_binding("ess_ipm");
	ipm_register_callback(ipm, sensor_ipm_callback, NULL);
	ipm_set_enabled(ipm, 1);

	while (1) {
		/* Notify value changes via BLE here so that the notification intervals can be controlled. */
		if (default_conn) {
			value16 = sys_cpu_to_le16(temp_value);
			bt_gatt_notify(default_conn, &attrs[2], &value16, sizeof(value16));
			task_sleep(INTERVAL * sys_clock_ticks_per_sec);

			value16 = sys_cpu_to_le16(humidity_value);
			bt_gatt_notify(default_conn, &attrs[6], &value16, sizeof(value16));
			task_sleep(INTERVAL * sys_clock_ticks_per_sec);

			value32 = sys_cpu_to_le32(pressure_value);
			bt_gatt_notify(default_conn, &attrs[10], &value32, sizeof(value32));
			task_sleep(INTERVAL * sys_clock_ticks_per_sec);

			value16 = sys_cpu_to_le16(uv_index_value);
			bt_gatt_notify(default_conn, &attrs[14], &uv_index_value, sizeof(uv_index_value));
		}
		task_sleep(INTERVAL * sys_clock_ticks_per_sec);
	}
}
