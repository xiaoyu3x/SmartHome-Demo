ccflags-y += ${PROJECTINCLUDE}
ccflags-y +=-I$(ZEPHYR_BASE)/include/drivers
ccflags-y +=-I$(ZEPHYR_BASE)/drivers -I$(ZEPHYR_BASE)/arch/x86

ifneq ($(VERSION_MAJOR), 1)
$(error This app works only with Zephyr 1.6)
endif

ifneq ($(VERSION_MINOR), 6)
$(error This app works only with Zephyr 1.6)
endif

obj-y = main.o
