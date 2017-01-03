# -*- coding: utf-8 -*-
"""
Task to fetch data
"""
import threading
import time
from random import randint
from RestClient import sensor as client
from RestClient import Resource as rsclient
from RestClient.api.IoTClient import IoTClient
from DB.api import resource, sensor_type
from CeleryTask.managers import base
from RestClient.api.iotError import IoTConnectionError
from utils.util import get_class
from DB import exception
from RestClient.api.NexmoClient import NexmoClient


class FetchData(threading.Thread):
    """Threaded device ata observer and parser.
    Username: username
    Resource_info: (href, dev_id, resource_type, resource_id)
    """
    def __init__(self, username, resource_info):
        threading.Thread.__init__(self)
        self.username = username
        self.gateway_id = IoTClient.get_gatewayid_by_user(username)
        self.href = resource_info[0]
        self.dev_id = resource_info[1]
        self.name = resource_info[3]
        self.resource_type = resource_info[2]
        self.client_conn = None
        self.start()

    def __repr__(self):
        return "%s" % self.href

    def connect(self):
        self.client_conn = client.Sensor(self.dev_id, self.href, self.resource_type, self.username)

    def run(self):
        try:
            # grabs urls of hosts and print data
            path = self.href
            dev_id = self.dev_id
            print("{}?di={}".format(path, dev_id))
            # ret = self.client.get("{}?di={}".format(typ, dev_id), {'obs': 1}, stream=True)
            self.connect()
            res = resource.get_resource(exception_when_missing=False, path=path, uuid=dev_id, status=True)
            kargs = {
                'sensor': res.get('sensor_type').get('mapping_class'),
                'resource_id': res.get('id'),
                'uuid': self.dev_id,
                'gateway_id': self.gateway_id,
            }
            self.client_conn.get_data(stream=True, callback=self.parse_data, **kargs)
        except IoTConnectionError as e:
            raise Exception("There was an error connecting to %s: %s : %r" % (dev_id, path, e))

    def kill(self):
        self.client_conn.terminate()

    @staticmethod
    def parse_data(data, **kargs):
        """parse the json data and save them in db."""
        if data:
            sensor = kargs.get('sensor')
            uuid = kargs.get('uuid')
            gateway_id = kargs.get('gateway_id')
            resource_id = kargs.get('resource_id')
            if sensor == 'power':
                power_add = get_class("DB.api.power.new")
                energy_add = get_class("DB.api.energy.new")

                new_energy = data.get('properties').get('power1')
                new_power = data.get('properties').get('power2')

                if new_power != 0:
                    content = {
                            'resource_id': resource_id,
                            'value': new_power,
                    }
                    # power_add(content)
                    print('update power: {}'.format(str(power_add(content))))

                if new_energy != 0:
                    content = {
                            # 'uuid': uuid,
                            'resource_id': resource_id,
                            'value': new_energy,

                    }
                    # energy_add(content)
                    print('update energy: {}'.format(str(energy_add(content))))
            else:
                # sensor = data.get('properties').get('id')
                add_method = get_class("DB.api.{}.new".format(sensor))
                status_method = get_class("DB.api.{}.get_latest_by_gateway_uuid".format(sensor))

                content = {
                    'resource_id': resource_id,
                }
                # obj = status_method(gateway_id, uuid)
                if sensor == 'solar':
                    new_tilt = data.get('properties').get('tiltPercentage')
                    if new_tilt is not None:
                        content.update({
                            'tiltpercentage': new_tilt,
                            'lcd_first': data.get('properties').get('lcd1'),
                            'lcd_second': data.get('properties').get('lcd2'),
                        })

                        # add_method(content)
                        print('update tilt percentage: {}'.format(str(add_method(content))))
                    else:
                        print("Unable to get tilt percentage.")
                elif sensor == 'illuminance':
                    new_ill = data.get('properties').get('illuminance')
                    if new_ill is not None:
                        content.update({
                            'illuminance': new_ill,
                        })
                        # add_method(content)
                        print('update illuminance: {}'.format(str(add_method(content))))
                    else:
                        print("Unable to get Illuminance status.")
                elif sensor == 'temperature':
                    new_temp = data.get('properties').get('temperature')
                    if new_temp is not None:
                        content.update({
                            'temperature': new_temp,
                            'units': data.get('properties').get('units'),
                            'range': data.get('properties').get('range'),
                        })

                        # add_method(content)
                        print('update temperature: {}'.format(str(add_method(content))))
                    else:
                        print("Unable to get Temperature status.")
                elif sensor == 'rgbled':
                    new_rgb = data.get('properties').get('rgbValue')
                    if new_rgb is not None:
                        content.update({
                            'rgbvalue': str(new_rgb),
                            'range': str(data.get('properties').get('range')),
                        })
                        # add_method(content)
                        print('update rdbled: {}'.format(str(add_method(content))))
                    else:
                        print("Unable to get Rgbled status .")
                elif sensor == 'environment':
                    env_data = data.get('properties')
                    if env_data is not None:
                        content.update({
                            'temperature': env_data.get('temperature'),
                            'pressure': env_data.get('pressure'),
                            'humidity': env_data.get('humidity'),
                            'uv_index': env_data.get('uvIndex'),
                        })
                        # add_method(content)
                        print('update environment: {}'.format(str(add_method(content))))
                    else:
                        print("Unable to get Environment sensor status .")
                else:
                    obj = status_method(resource_id)
                    status = bool(obj.get('status')) if obj else None
                    new_sts = bool(data.get('properties').get('value'))
                    if status != new_sts:
                        content.update({
                            'status': new_sts,
                        })
                        print('update {} data: {}'.format(sensor, str(add_method(content))))
                        if new_sts and NexmoClient.send_message(gateway_id, uuid, sensor):
                            print('Sent text alert to users for {} status is True.'.format(sensor))
                    else:
                        print("{} status {} has not been changed.".format(sensor, new_sts))


class DataManager(base.BaseTask):
    """The task class to collect and update resources
        and pull each device data by thread
    """
    RESOURCE_UPDATE_INTERVAL = 10
    MAX_THREAD = 20

    def __init__(self, username):
        self._client = None
        self._sensor_type_map = DataManager.get_sensor_types_map()
        self.username = username
        self.gateway_id = IoTClient.get_gatewayid_by_user(username)

    @staticmethod
    def get_sensor_types_map():
        types = sensor_type.get_all_types()
        mapping = {t_dict['type']: t_dict['id'] for t_dict in types}
        return mapping

    def _connect(self):
        if not self._client:
            self._client = rsclient.Resource(self.username)

    def _get_active_resource(self):
        """
        Get active resource in db
        return a tuple (di, path)
        """
        self._connect()
        return self._client.list_resource()

    def update_resource(self, active_resource=[]):
        """
        Pull resource and update their status in db
        :param: active_resource: tuple, (uuid, href, resource_type)
        """
        active_resource_ids = []
        for i, v in enumerate(active_resource):
            uuid, href, typ = v[0], v[1], v[2]
            if typ not in self._sensor_type_map.keys():
                self.log.error("Unsupported resource type: {}.".format(typ))
                continue

            try:
                ret = resource.get_resource(exception_when_missing=False, path=href, uuid=uuid)
            except IoTConnectionError:
                continue

            if not ret:
                ret = resource.add_resource({
                    'uuid': uuid,
                    'sensor_type_id': self._sensor_type_map[typ],
                    'gateway_id': self.gateway_id,
                    'status': True,
                    'path': href,
                })
                self.log.info('Resource {} is added.'.format(str(ret)))
                active_resource_ids.append(ret.get('id'))
            elif not ret.get('status'):
                # update resource status
                resource.update_resource(ret.get('id'), status=True)
                active_resource_ids.append(ret.get('id'))
            else:
                active_resource_ids.append(ret.get('id'))
            active_resource[i] = v + (ret.get('id'), )
        self._update_resource(active_resource_ids)

    def _update_resource(self, active_resource_ids=[]):
        for res in resource.list_resource(status=True, gateway_id=self.gateway_id):
            res_id = res.get('id')
            # res_uuid = res.get('uuid')
            if res_id and res_id not in active_resource_ids:
                resource.update_resource(res_id, status=False)

    def _fetch_data(self):
        """
        Resource connection pool management
        """
        connections = {}
        while True:
            self.log.debug('---begin for loop---')
            try:
                ls = self._get_active_resource()
                self.update_resource(ls)
                # print ls
                self.log.debug("{}".format(str(ls)))
            except exception.DatabaseException:
                time.sleep(2)
                continue

            # remove dead threads in the conn pool
            main_thread = threading.currentThread()
            running_id = [th.getName() for th in threading.enumerate() if th is not main_thread and th.is_alive()]
            self.log.info('running ids: {}, total: {}'.format(str([rid for rid in running_id]), len(running_id)))

            dead_id = set(connections.keys()) - set(running_id)
            for rid in dead_id:
                self.log.info("Thread {} is dead. Remove it from the connection pool. ".format(rid))
                del connections[rid]
            self.log.info('dead ids: ' + str(dead_id))

            # latest resource ids pulled from the gateway
            existing_id_list = [str(rid) for di, href, rt, rid in ls]

            # find threads with obsolete ids and remove them
            zombie_id = set(connections.keys()) - set(existing_id_list)
            for rid in zombie_id:
                self.log.info("kill zombie threads: {}".format(rid))
                connections[rid].kill()
                del connections[rid]

            self.log.info('active threads: {}, total: {}'.format(str([rid for rid in connections.keys()]),
                                                                 len(connections.keys())))

            for di, href, rt, rid in ls:
                if str(rid) not in connections.keys() and str(rid) not in running_id:
                    if len(connections) >= self.MAX_THREAD:
                        # quit the loop cos it exceeds max threads limit
                        self.log.info("Exceeded maximal thread threshold {}, queuing request "
                                      "for {}?di={}".format(self.MAX_THREAD, href, di))
                        self.log.info(connections.keys())
                        break
                    time.sleep(randint(0, 5))
                    t = FetchData(self.username, (href, di, rt, rid))
                    connections[str(rid)] = t
                    self.log.info('threads in the pool: ' + str(connections))
                # logging.debug('end of for.')

            self.log.debug('---sleep 10 secs---')
            time.sleep(self.RESOURCE_UPDATE_INTERVAL)

    def run(self):
        self._fetch_data()


if __name__ == '__main__':
    task = DataManager('dev')
    task.run()

