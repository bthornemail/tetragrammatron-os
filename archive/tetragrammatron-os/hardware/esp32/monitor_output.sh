#!/bin/bash
# Simple script to monitor ESP32 output while testing
# Usage: ./monitor_output.sh

stty -F /dev/ttyUSB0 115200 raw -echo
cat /dev/ttyUSB0







