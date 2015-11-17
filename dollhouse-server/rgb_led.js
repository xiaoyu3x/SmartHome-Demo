var mraa = require("mraa"),
    clockPin,
    dataPin;

exports.setupHardware = function() {
    clockPin = new mraa.Gpio(7);
    clockPin.dir(mraa.DIR_OUT);
    dataPin = new mraa.Gpio(8);
    dataPin.dir(mraa.DIR_OUT);

    exports.setColorRGB(0, 0, 0);
}

function clk() {
  clockPin.write(0);
  clockPin.write(1);
}

function sendByte( b ) {
    // send one bit at a time
    for ( var i=0; i<8; i++ ) {
      if ((b & 0x80) != 0)
        dataPin.write(1);
      else
        dataPin.write(0);

      clk();
      b <<= 1;
  }
}

function sendColor( red, green, blue ) {
    // start by sending a byte with the format "1 1 /B7 /B6 /G7 /G6 /R7 /R6"
    var prefix = 0xC0;

    if ((blue & 0x80) == 0) prefix |= 0x20;
    if ((blue & 0x40) == 0) prefix |= 0x10;
    if ((green & 0x80) == 0) prefix |= 0x08;
    if ((green & 0x40) == 0) prefix |= 0x04;
    if ((red & 0x80) == 0) prefix |= 0x02;
    if ((red & 0x40) == 0) prefix |= 0x01;

    sendByte(prefix);

    sendByte(blue);
    sendByte(green);
    sendByte(red);
}

exports.setColorRGB = function( red, green, blue ) {
    // send prefix 32 x "0"
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);

    sendColor(red, green, blue);

    // terminate data frame
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);
    sendByte(0x00);
}
