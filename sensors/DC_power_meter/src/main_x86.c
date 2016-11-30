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

#define DEVICE_NAME			"Zephyr DC Power Meter"
#define DEVICE_NAME_LEN			(sizeof(DEVICE_NAME) - 1)
#define CONSUMPTION_CUD			"Consumption Power"
#define SOLAR_CUD			"Solar Power"
#define CONSUMPTION_CHANNEL		101
#define SOLAR_CHANNEL			102

/* Interval between notifications (second) */
#define INTERVAL	1

QUARK_SE_IPM_DEFINE(power_ipm, 0, QUARK_SE_IPM_INBOUND);

static uint32_t consumption_value;
static uint32_t solar_value;
static uint8_t ccc_value;

static struct bt_gatt_ccc_cfg consumption_ccc_cfg[CONFIG_BLUETOOTH_MAX_PAIRED] = {};
static struct bt_gatt_ccc_cfg solar_ccc_cfg[CONFIG_BLUETOOTH_MAX_PAIRED] = {};
struct bt_conn *default_conn;

static void sensor_ccc_cfg_changed(uint16_t value)
{
        ccc_value = value;;
}

static ssize_t read_u32(struct bt_conn *conn, const struct bt_gatt_attr *attr,
			void *buf, uint16_t len, uint16_t offset)
{
	const uint32_t *u32 = attr->user_data;
	uint32_t value = sys_cpu_to_le32(*u32);

	return bt_gatt_attr_read(conn, attr, buf, len, offset, &value,
				 sizeof(value));
}

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
	/* Custom power service UUID 9C10C448-3082-44CD-853D-08266C070BE5 */
	BT_DATA_BYTES(BT_DATA_UUID128_ALL,
			0xE5, 0x0B, 0x07, 0x6C, 0x26, 0x08, 0x3D, 0x85,
			0xCD, 0x44, 0x82, 0x30, 0x48, 0xC4, 0x10, 0x9C)
};

static struct bt_data sd[] = {
	BT_DATA(BT_DATA_NAME_COMPLETE, DEVICE_NAME, DEVICE_NAME_LEN)
};

/* Power Service variables */
/* Service UUID 9C10C448-3082-44CD-853D-08266C070BE5 */
static struct bt_uuid_128 power_uuid = BT_UUID_INIT_128(
			0xE5, 0x0B, 0x07, 0x6C, 0x26, 0x08, 0x3D, 0x85,
			0xCD, 0x44, 0x82, 0x30, 0x48, 0xC4, 0x10, 0x9C);

/* Characteristic UUID of consumption power 71C9E918-8302-47AA-89D3-7BF67152237A */
static struct bt_uuid_128 consumption_power_uuid = BT_UUID_INIT_128(
			0x7A, 0x23, 0x52, 0x71, 0xF6, 0x7B, 0xD3, 0x89,
			0xAA, 0x47, 0x02, 0x83, 0x18, 0xE9, 0xC9, 0x71);

/* Characteristic UUID of solar power 0609E802-AFD2-4D56-B61C-12BA1F80CCB6 */
static struct bt_uuid_128 solar_power_uuid = BT_UUID_INIT_128(
			0xB6, 0xCC, 0x80, 0x1F, 0xBA, 0x12, 0x1C, 0xB6,
			0x56, 0x4D, 0xD2, 0xAF, 0x02, 0xE8, 0x09, 0x06);

static struct bt_gatt_attr attrs[] = {
	BT_GATT_PRIMARY_SERVICE(&power_uuid),

	BT_GATT_CHARACTERISTIC(&consumption_power_uuid.uuid,
				BT_GATT_CHRC_READ | BT_GATT_CHRC_NOTIFY),
	BT_GATT_DESCRIPTOR(&consumption_power_uuid.uuid, BT_GATT_PERM_READ,
				read_u32, NULL, &consumption_value),
	BT_GATT_CUD(CONSUMPTION_CUD, BT_GATT_PERM_READ),
	BT_GATT_CCC(consumption_ccc_cfg, sensor_ccc_cfg_changed),

	BT_GATT_CHARACTERISTIC(&solar_power_uuid.uuid,
				BT_GATT_CHRC_READ | BT_GATT_CHRC_NOTIFY),
	BT_GATT_DESCRIPTOR(&solar_power_uuid.uuid, BT_GATT_PERM_READ,
				read_u32, NULL, &solar_value),
	BT_GATT_CUD(SOLAR_CUD, BT_GATT_PERM_READ),
	BT_GATT_CCC(solar_ccc_cfg, sensor_ccc_cfg_changed)
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
	volatile uint32_t *value;

	switch (id) {
	case CONSUMPTION_CHANNEL:
		value = data;
		if (consumption_value != *value)
			consumption_value = *value;
		break;
	case SOLAR_CHANNEL:
		value = data;
		if (solar_value != *value)
			solar_value = *value;
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
	uint32_t value32;

	rc = bt_enable(bt_ready);
	if (rc) {
		printk("Bluetooth init failed (err %d)\n", rc);
		return;
	}
	bt_conn_cb_register(&conn_callbacks);
	bt_conn_auth_cb_register(&auth_cb_display);

	ipm = device_get_binding("power_ipm");
	ipm_register_callback(ipm, sensor_ipm_callback, NULL);
	ipm_set_enabled(ipm, 1);

	while (1) {
		if (default_conn) {
			value32 = sys_cpu_to_le32(consumption_value);
			bt_gatt_notify(default_conn, &attrs[2], &value32,
					sizeof(value32));
			task_sleep(INTERVAL * sys_clock_ticks_per_sec);

			value32 = sys_cpu_to_le32(solar_value);
			bt_gatt_notify(default_conn, &attrs[6], &value32,
					sizeof(value32));
			task_sleep(INTERVAL * sys_clock_ticks_per_sec);
		}
		task_sleep(INTERVAL * sys_clock_ticks_per_sec);
	}
}
