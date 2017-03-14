ccflags-y += ${PROJECTINCLUDE}
ccflags-y +=-I$(ZEPHYR_BASE)/include/drivers
ccflags-y +=-I$(ZEPHYR_BASE)/drivers -I$(ZEPHYR_BASE)/arch/x86

ifneq ($(VERSION_MAJOR), 1)
$(error This app works only with Zephyr 1.6 or above)
endif

ifneq ($(shell test $(VERSION_MINOR) -gt 5; echo $$?),0)
$(error This app works only with Zephyr 1.6 or above)
endif

obj-y = main.o
