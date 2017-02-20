// Copyright 2017 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function Aio(port){
        this.upm = require('jsupm_ads1x15');

        switch(port) {
                case 0:
                        this.port = this.upm.ADS1X15.SINGLE_0;
                        break;
                case 1:
                        this.port = this.upm.ADS1X15.SINGLE_1;
                        break;
                case 2:
                        this.port = this.upm.ADS1X15.SINGLE_2;
                        break;
                case 3:
                        this.port = this.upm.ADS1X15.SINGLE_3;
                        break;
                default:
                        this.port = this.upm.ADS1X15.SINGLE_0;
        }
        //this.port = port;
        //this.upm = require('jsupm_ads1x15');
        this.ads1115 = new this.upm.ADS1115(0, 0x48);
        this.ads1115.getSample(this.upm.ADS1X15.SINGLE_0);
        this.ads1115.setGain(this.upm.ADS1X15.GAIN_ONE);
        this.ads1115.setSPS(0x0080);
        this.ads1115.setContinuous(true);
}

Aio.prototype.read = function() {
        return this.ads1115.getSample(this.port);
};



exports.Aio = Aio;
