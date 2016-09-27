#!/bin/bash

# This script needs to run at least once prior to pushing apps from this directory.
# Upon running it finds and copies all license files to vendor folder

CURR_DIR=`pwd`
pushd .
# delete the existing $VENDOR_DIR folder and download dependencies again
VENDOR_DIR=$CURR_DIR/vendor
WHEELS_DIR=$CURR_DIR/wheels

rm -rf $VENDOR_DIR $WHEELS_DIR
mkdir -p $VENDOR_DIR

pip install --no-use-wheel --download $VENDOR_DIR -r requirements.txt

cp -rp $VENDOR_DIR $WHEELS_DIR

COPYWRITE=$VENDOR_DIR/COPYWRITE
touch $COPYWRITE

cp -rp $CURR_DIR/licenses $VENDOR_DIR

function get_tar_licenses {
  filename=$1
  pushd $filename
  echo "$filename" >> $COPYWRITE
  license_file=`find . -iname "license*"`
  copyright_file=`find . -iname "copyright*"`
  if [ ! -z "$license_file" ]; then
     cat $license_file >> $COPYWRITE;
  else 
     if [ ! -z "$copyright_file" ]; then
        cat $copyright_file >> $COPYWRITE;
        else 
           if [ ! -f $VENDOR_DIR/licenses/$filename ]; then
              echo  "Error: Package $filename doesn't have a LICENSE file"
#              exit 1
           else
              cat $VENDOR_DIR/licenses/$filename >> $COPYWRITE
           fi
     fi
  echo "##########"  >> $COPYWRITE
  fi
  popd
}

pushd $WHEELS_DIR

# unpack all tar files
for file in `find . -name "*.tar.gz"`; do 
  tar -xvzf $file;
  rm -rf $file;
done

# unpack all zip files
for file in `find . -name "*.zip"`; do 
  unzip $file;
  rm -rf $file;
done

# unpack all wheels
for file in `find . -name "*.whl"`; do 
  wheel unpack $file -d $WHEELS_DIR;
  rm -rf $file;
done

for filename in `ls`; do 
  get_tar_licenses $filename
done

popd
cp -rp $VENDOR_DIR .
popd
