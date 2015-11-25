

TARGET = ocserver

$(TARGET): ocserver.cpp
	g++ $^ -std=c++11  -pthread -lupm-i2clcd -lmraa -loctbstack -I/usr/include/upm/ -I/usr/include/iotivity/resource/stack/ -I/usr/include/iotivity/resource/stack/ -I/usr/include/iotivity/resource/logger/ -I/usr/include/iotivity/resource/oc_logger/ -o $@

#ocserver.o: ocserver.cpp
#	g++ -o $@ -std=c++11 -pthread -lmraa -loctbstack -I/usr/include/iotivity/resource/stack/ -I/usr/include/iotivity/resource/logger/ \
#	-I/usr/include/iotivity/resource/oc_logger/  -c $<

#rgb_lcd.a: rgb_lcd.o 
#	ar rcs $@ $^
#
#rgb_lcd.o: rgb_lcd.cpp rgb_lcd.h
#	g++ -c -std=c++11 -lmraa -o $@ $<
#
clean:
	rm -f *.o *.a $(TARGET)