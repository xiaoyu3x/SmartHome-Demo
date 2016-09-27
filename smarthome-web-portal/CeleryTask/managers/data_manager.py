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
from DB.api import resource
from CeleryTask.managers import base
from RestClient.api.iotError import IoTConnectionError
from utils.util import get_class
from DB import exception
from RestClient.api.NexmoClient import NexmoClient


class FetchData(threading.Thread):
    """Threaded device ata observer and parser. """
    def __init__(self, username, href, dev_id):
        threading.Thread.__init__(self)
        self.username = username
        self.gateway_id = IoTClient.get_gatewayid_by_user(username)
        self.href = href
        self.dev_id = dev_id
        self.name = dev_id
        self.client_conn = None
        self.start()

    def __repr__(self):
        return "%s" % self.href

    def connect(self):
        self.client_conn = client.Sensor(self.dev_id, self.href, self.username)

    def run(self):
        try:
            # grabs urls of hosts and print data
            typ = self.href
            dev_id = self.dev_id
            print "{}?di={}".format(typ, dev_id)
            # ret = self.client.get("{}?di={}".format(typ, dev_id), {'obs': 1}, stream=True)
            self.connect()
            res = resource.get_resource(exception_when_missing=False, path=typ, uuid=dev_id, status=True)
            kargs = {
                'sensor': res.get('sensor_type').get('type'),
                'uuid': self.dev_id,
                'gateway_id': self.gateway_id
            }
            self.client_conn.get_data(stream=True, callback=self.parse_data, **kargs)
        except IoTConnectionError as e:
            raise Exception("There was an error connecting to %s: %r" % (dev_id, e))

    def kill(self):
        self.client_conn.terminate()

    @staticmethod
    def parse_data(data, **kargs):
        """parse the json data and save them in db."""
        if data:
            sensor = kargs.get('sensor')
            uuid = kargs.get('uuid')
            gateway_id = kargs.get('gateway_id')
            if sensor == 'power':
                power_add = get_class("DB.api.power.new")
                energy_add = get_class("DB.api.energy.new")

                new_energy = data.get('properties').get('power1')
                new_power = data.get('properties').get('power2')

                if new_power != 0:
                    content = {
                            'uuid': uuid,
                            'gateway_id': gateway_id,
                            'value': new_power,

                    }
                    # power_add(content)
                    print 'update power: {}'.format(str(power_add(content)))

                if new_energy != 0:
                    content = {
                            'uuid': uuid,
                            'gateway_id': gateway_id,
                            'value': new_energy,

                    }
                    # energy_add(content)
                    print 'update energy: {}'.format(str(energy_add(content)))
            else:
                # sensor = data.get('properties').get('id')
                add_method = get_class("DB.api.{}.new".format(sensor))
                status_method = get_class("DB.api.{}.get_latest_by_gateway_uuid".format(sensor))

                content = {
                    'uuid': uuid,
                    'gateway_id': gateway_id,
                }
                # obj = status_method(gateway_id, uuid)
                if sensor == 'solar':
                    new_tilt = data.get('properties').get('tiltPercentage')
                    if new_tilt:
                        content.update({
                            'tiltpercentage': new_tilt,
                            'lcd_first': data.get('properties').get('lcd1'),
                            'lcd_second': data.get('properties').get('lcd2'),
                        })
                        # add_method(content)
                        print 'update tilt percentage: {}'.format(str(add_method(content)))
                    else:
                        print "Unable to get tilt percentage."
                elif sensor == 'illuminance':
                    new_ill = data.get('properties').get('illuminance')
                    if new_ill:
                        content.update({
                            'illuminance': new_ill,
                        })
                        # add_method(content)
                        print 'update illuminance: {}'.format(str(add_method(content)))
                    else:
                        print "Unable to get Illuminance status."
                elif sensor == 'temperature':
                    new_temp = data.get('properties').get('temperature')
                    if new_temp:
                        content.update({
                            'temperature': new_temp,
                            'units': data.get('properties').get('units'),
                            'range': data.get('properties').get('range'),
                        })
                        # add_method(content)
                        print 'update temperature: {}'.format(str(add_method(content)))
                    else:
                        print "Unable to get Temperature status."
                elif sensor == 'rgbled':
                    new_rgb = data.get('properties').get('rgbValue')
                    if new_rgb:
                        content.update({
                            'rgbvalue': new_rgb,
                            'range': data.get('properties').get('range'),
                        })
                        # add_method(content)
                        print 'update rdbled: {}'.format(str(add_method(content)))
                    else:
                        print "Unable to get Rgbled status ."
                else:
                    obj = status_method(gateway_id, uuid)
                    status = bool(obj.get('status')) if obj else None
                    new_sts = bool(data.get('properties').get('value'))
                    if status != new_sts:
                        content.update({
                            'status': new_sts,
                        })
                        print 'update {} data: {}'.format(sensor, str(add_method(content)))
                        if new_sts and NexmoClient.send_message(gateway_id, uuid, sensor):
                            print 'Sent text alert to users for {} status is True.'.format(sensor)
                    else:
                        print "{} status {} has not been changed.".format(sensor, new_sts)


class DataManager(base.BaseTask):
    """The task class to collect and update resources
        and pull each device data by thread
    """
    RESOURCE_UPDATE_INTERVAL = 10
    MAX_THREAD = 20

    _sensor_type_map = {
        '/a/fan': 1,
        '/a/pir': 2,
        '/a/gas': 3,
        '/a/solar': 4,
        '/a/illuminance': 5,
        '/a/buzzer': 6,
        '/a/temperature': 7,
        '/a/rgbled': 8,
        '/a/led': 9,
        '/a/button': 10,
        '/a/power': 11,
    }

    def __init__(self, username):
        self._client = None
        self.username = username
        self.gateway_id = IoTClient.get_gatewayid_by_user(username)

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
        :param: active_resource: tuple, (uuid, device_ type)
        """
        active_resource_ids = []
        for uuid, typ in active_resource:
            if typ not in self._sensor_type_map.keys():
                self.log.error("Unsupported query path: {}.".format(typ))
                continue

            try:
                ret = resource.get_resource(exception_when_missing=False, path=typ, uuid=uuid)
            except IoTConnectionError:
                continue

            if not ret:
                rs = resource.add_resource({
                    'uuid': uuid,
                    'sensor_type_id': self._sensor_type_map[typ],
                    'gateway_id': self.gateway_id,
                    'status': True,
                    'path': typ,
                })
                self.log.info('Resource {} is added.'.format(str(rs)))
                active_resource_ids.append(rs.get('id'))
            elif not ret.get('status'):
                # update resource status
                resource.update_resource(ret.get('id'), status=True)
                active_resource_ids.append(ret.get('id'))
            else:
                active_resource_ids.append(ret.get('id'))
        self._update_resource(active_resource_ids)

    def _update_resource(self, active_resource_ids=[]):
        for res in resource.list_resource(status=True, gateway_id=self.gateway_id):
            res_id = res.get('id')
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
            self.log.info('running ids: {}, total: {}'.format(str([rid.split('-')[-1] for rid in running_id]), len(running_id)))

            dead_id = set(connections.keys()) - set(running_id)
            for di in dead_id:
                self.log.info("Thread {} is dead. Remove it from the connection pool. ".format(di))
                del connections[di]
            self.log.info('dead ids: ' + str(dead_id))

            # latest resource ids pulled from the gateway
            existing_di_list = [di for di, href in ls]

            # find threads with obsolete ids and remove them
            zombie_di = set(connections.keys()) - set(existing_di_list)
            for di in zombie_di:
                self.log.info("kill zombie threads: {}".format(di))
                connections[di].kill()
                del connections[di]

            self.log.info('active threads: {}, total: {}'.format(str([rid.split('-')[-1] for rid in connections.keys()]), len(connections.keys())))

            for di, href in ls:
                if di not in connections.keys() and di not in running_id:
                    if len(connections) >= self.MAX_THREAD:
                        # quit the loop cos it exceeds max threads limit
                        self.log.info("Exceeded maximal thread threshold {}, queuing request "
                                      "for {}?di={}".format(self.MAX_THREAD, href, di))
                        self.log.info(connections.keys())
                        break
                    time.sleep(randint(0, 5))
                    t = FetchData(self.username, href, di)
                    connections[di] = t
                    self.log.info('threads in the pool: ' + str(connections))
                # logging.debug('end of for.')

            self.log.debug('---sleep 10 secs---')
            time.sleep(self.RESOURCE_UPDATE_INTERVAL)

    def run(self):
        self._fetch_data()


if __name__ == '__main__':
    task = DataManager('dev')
    task.run()

