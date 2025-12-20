#!/usr/bin/env python3
"""
mesh_anchor.py — Agent 7 UDP/TCP heartbeat collector

Listens for ROLE_HEARTBEAT JSONL records coming from Termux phones (or other
mesh participants) and writes them to an append-only log.  Optionally echoes a
compact summary to stdout so you can watch the mesh converge in real time.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import socket
import sys
from typing import Optional


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect ROLE_HEARTBEAT packets from mesh agents."
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Interface to bind (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=7777,
        help="Port to listen on (default: 7777)",
    )
    parser.add_argument(
        "--log",
        default="mesh-logs/anchor-heartbeats.jsonl",
        help="Path to append JSONL records (default: mesh-logs/anchor-heartbeats.jsonl)",
    )
    parser.add_argument(
        "--proto",
        choices=("udp", "tcp"),
        default="udp",
        help="Transport protocol to use (default: udp)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Do not print per-packet summaries to stdout",
    )
    return parser.parse_args()


def ensure_log_dir(log_path: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(log_path)), exist_ok=True)


def log_record(log_path: str, record: dict) -> None:
    with open(log_path, "a", encoding="utf-8") as fp:
        fp.write(json.dumps(record, separators=(",", ":")) + "\n")


def decode_payload(raw: str) -> Optional[dict]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def summarize(addr: str, payload: Optional[dict], raw: str) -> str:
    if payload:
        device = payload.get("device", "?")
        role = payload.get("role", "?")
        phase = payload.get("phase", "?")
        grade = payload.get("grade", "?")
        tick = payload.get("tick", "?")
        return (
            f"{addr:<21} device={device:<18} role={role:<10} "
            f"tick={tick:<6} phase={phase} grade={grade}"
        )
    return f"{addr:<21} raw={raw[:120]}"


def run_udp(host: str, port: int, log_path: str, quiet: bool) -> None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((host, port))
    if not quiet:
        print(f"[mesh-anchor] UDP listening on {host}:{port}", flush=True)
    while True:
        data, addr = sock.recvfrom(4096)
        raw = data.decode("utf-8", "replace").strip()
        payload = decode_payload(raw)
        record = {
            "recv_at": dt.datetime.utcnow().isoformat(timespec="milliseconds") + "Z",
            "remote": f"{addr[0]}:{addr[1]}",
            "raw": raw,
            "payload": payload,
        }
        log_record(log_path, record)
        if not quiet:
            print(summarize(record["remote"], payload, raw), flush=True)


def run_tcp(host: str, port: int, log_path: str, quiet: bool) -> None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((host, port))
    sock.listen(5)
    if not quiet:
        print(f"[mesh-anchor] TCP listening on {host}:{port}", flush=True)
    while True:
        conn, addr = sock.accept()
        try:
            raw = conn.recv(4096).decode("utf-8", "replace").strip()
        finally:
            conn.close()
        if not raw:
            continue
        payload = decode_payload(raw)
        record = {
            "recv_at": dt.datetime.utcnow().isoformat(timespec="milliseconds") + "Z",
            "remote": f"{addr[0]}:{addr[1]}",
            "raw": raw,
            "payload": payload,
        }
        log_record(log_path, record)
        if not quiet:
            print(summarize(record["remote"], payload, raw), flush=True)


def main() -> None:
    args = parse_args()
    ensure_log_dir(args.log)
    try:
        if args.proto == "udp":
            run_udp(args.host, args.port, args.log, args.quiet)
        else:
            run_tcp(args.host, args.port, args.log, args.quiet)
    except KeyboardInterrupt:
        print("\n[mesh-anchor] stopping", file=sys.stderr)


if __name__ == "__main__":
    main()
