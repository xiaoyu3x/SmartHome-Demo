ccflags-y += ${PROJECTINCLUDE} \
		-I$(ZEPHYR_BASE)/include/drivers \
		-I$(ZEPHYR_BASE)/drivers -I$(ZEPHYR_BASE)/arch/arc

ifneq ($(VERSION_MAJOR), 1)
$(error This app works only with Zephyr 1.6)
endif

ifneq ($(VERSION_MINOR), 6)
$(error This app works only with Zephyr 1.6)
endif

obj-y = main.o
