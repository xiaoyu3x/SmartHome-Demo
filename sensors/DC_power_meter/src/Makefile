ccflags-y += ${PROJECTINCLUDE} \
		-I$(ZEPHYR_BASE)/include/drivers \
		-I$(ZEPHYR_BASE)/drivers

ifneq ($(VERSION_MAJOR), 1)
$(error This app works only with Zephyr 1.6 or above)
endif

ifneq ($(shell test $(VERSION_MINOR) -gt 5; echo $$?),0)
$(error This app works only with Zephyr 1.6 or above)
endif

ifeq ($(ARCH), arc)
	obj-y = main_arc.o
else
	obj-y = main_x86.o
endif
