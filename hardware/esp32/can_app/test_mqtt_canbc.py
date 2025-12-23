#!/usr/bin/env python3
"""
Test script to send CANBC commands to ESP32 via MQTT

Usage:
    python3 test_mqtt_canbc.py <broker_host> <device_id> [test_name]

Examples:
    python3 test_mqtt_canbc.py localhost esp32-aabbccddeeff nop
    python3 test_mqtt_canbc.py gateway esp32-aabbccddeeff load
"""

import sys
import json
import time
import paho.mqtt.client as mqtt

# Test programs (hex-encoded CANBC bytecode)
TESTS = {
    "nop": {
        "addr": "1A020403027F11C7",
        "payload": "0001"  # NOP, HALT
    },
    "load": {
        "addr": "1A020403027F11C7",
        "payload": "11AA1112BBCC1132DDEEFF00"  # LOAD8 r0=0xAA, LOAD16 r1=0xBBCC, LOAD32 r2=0xDDEEFF00
    },
    "math": {
        "addr": "1A020403027F11C7",
        "payload": "110A110520200001"  # LOAD8 r0=10, LOAD8 r1=5, ADD r2=r0+r1
    }
}

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT broker: {rc}")

def on_message(client, userdata, msg):
    print(f"Received attestation: {msg.topic}")
    print(f"  {msg.payload.decode()}")

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    broker = sys.argv[1]
    device_id = sys.argv[2]
    test_name = sys.argv[3] if len(sys.argv) > 3 else "nop"

    if test_name not in TESTS:
        print(f"Unknown test: {test_name}")
        print(f"Available tests: {', '.join(TESTS.keys())}")
        sys.exit(1)

    test = TESTS[test_name]
    topic = f"tetragrammatron/{device_id}/canbc/command"
    attest_topic = f"tetragrammatron/{device_id}/canbc/attestation"

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, 1883, 60)
    client.loop_start()

    # Subscribe to attestations
    client.subscribe(attest_topic)
    print(f"Subscribed to: {attest_topic}")

    # Send command
    cmd = {
        "addr": test["addr"],
        "payload": test["payload"]
    }
    print(f"\nSending command to {topic}:")
    print(f"  Address: {test['addr']}")
    print(f"  Payload: {test['payload']}")
    client.publish(topic, json.dumps(cmd))
    print("Command sent, waiting for attestation...\n")

    # Wait for response
    time.sleep(3)
    client.loop_stop()
    client.disconnect()

if __name__ == "__main__":
    main()


