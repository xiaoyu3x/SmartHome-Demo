# Use Ubuntu as a base image
FROM ubuntu:16.04

# Allow to set-up HTTP(S) proxy using '--build-arg'
ARG http_proxy
ENV http_proxy ${http_proxy}
RUN echo $http_proxy

ARG https_proxy
ENV https_proxy ${https_proxy}
RUN echo $https_proxy

# Update the repository sources list
RUN apt-get clean && apt-get update

# Install common tools
RUN apt-get install -y wget unzip default-jdk maven

# Configuration settings & options
ENV WORKSPACE           /opt
ENV ANDROID_HOME        $WORKSPACE/android-sdk-linux
ENV IOTIVITY            $WORKSPACE/iotivity
ENV OUT                 $WORKSPACE/out
ENV MOUNT               $WORKSPACE/mnt

ENV iotivity_checkout_branch 1.3.0
ENV iotivity_scons_build_linux_security_tool TARGET_OS=linux resource/csdk/security/tool
ENV iotivity_scons_build_android_x86 TARGET_OS=android ANDROID_HOME=$ANDROID_HOME TARGET_ARCH=x86 java
ENV iotivity_scons_build_android_armeabi TARGET_OS=android ANDROID_HOME=$ANDROID_HOME TARGET_ARCH=armeabi java

# Install the basic Android command line tools
WORKDIR $WORKSPACE
ENV ANDROID_SDK_TOOLS sdk-tools-linux-3859397.zip
RUN wget https://dl.google.com/android/repository/$ANDROID_SDK_TOOLS
RUN unzip $ANDROID_SDK_TOOLS -d $ANDROID_HOME
RUN rm -f $ANDROID_SDK_TOOLS

# Install 'Android API 21' and 'Android SDK Build Tools 20.0.0' required by IoTivity Android
WORKDIR $ANDROID_HOME
RUN yes | tools/bin/sdkmanager --licenses
RUN tools/bin/sdkmanager "platforms;android-21"
RUN tools/bin/sdkmanager "build-tools;20.0.0"

# Install IoTivity build dependencies
RUN apt-get install -y \
    build-essential git scons libtool autoconf valgrind doxygen wget unzip
RUN apt-get install -y \
    libboost-dev libboost-program-options-dev libboost-thread-dev \
    uuid-dev libexpat1-dev libglib2.0-dev libsqlite3-dev libcurl4-gnutls-dev

# Android aapt requires 32-bit libraries installed
RUN apt-get install -y \
    lib32stdc++6 lib32z1

# Setup IoTivity repository
WORKDIR $IOTIVITY
RUN git clone https://gerrit.iotivity.org/gerrit/p/iotivity.git $IOTIVITY
RUN git checkout $iotivity_checkout_branch

# Pull the tinycbor and mbedtls projects before building IoTivity
RUN git clone https://github.com/01org/tinycbor.git extlibs/tinycbor/tinycbor -b v0.4.1
RUN git clone https://github.com/ARMmbed/mbedtls.git extlibs/mbedtls/mbedtls -b mbedtls-2.4.0

# Start building IoTivity
RUN scons $iotivity_scons_build_linux_security_tool
# Note: Android native libraries of different architectures will be accumulated
RUN scons $iotivity_scons_build_android_armeabi
RUN scons $iotivity_scons_build_android_x86

# Stage deliberables
WORKDIR $OUT
RUN cp -f $IOTIVITY/out/linux/*/*/resource/csdk/security/tool/json2cbor .
RUN cp -f $IOTIVITY/out/linux/*/*/liboctbstack.so .
RUN cp -f $IOTIVITY/out/linux/*/*/libconnectivity_abstraction.so .
RUN cp -f $IOTIVITY/java/iotivity-android/build/outputs/aar/iotivity-base-x86-release.aar \
          iotivity-base-release.aar

# Install the libraries to local maven repository
RUN mvn install:install-file -Dfile=$OUT/iotivity-base-release.aar -DgroupId=org.iotivity -DartifactId=base -Dversion=1.3.0-secured -Dpackaging=aar

# Unset proxy
ENV http_proxy ""
ENV https_proxy ""

# Build the Android app
VOLUME $MOUNT
WORKDIR $MOUNT
ENTRYPOINT [ -f $MOUNT/gradlew ] \
        && echo 'sdk.dir='$ANDROID_HOME > local.properties \
        && ./gradlew assembleDebug \
        || echo 'Gradle Wrapper not available in ' $MOUNT
