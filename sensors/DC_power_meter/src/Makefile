ccflags-y += ${PROJECTINCLUDE} \
		-I$(ZEPHYR_BASE)/include/drivers \
		-I$(ZEPHYR_BASE)/drivers

ifneq ($(VERSION_MAJOR), 1)
$(error This app works only with Zephyr 1.6)
endif

ifneq ($(VERSION_MINOR), 6)
$(error This app works only with Zephyr 1.6)
endif

ifeq ($(ARCH), arc)
	obj-y = main_arc.o
else
	obj-y = main_x86.o
endif
