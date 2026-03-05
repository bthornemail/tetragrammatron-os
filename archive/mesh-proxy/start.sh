#!/bin/sh
# start.sh — policy-free invariant executor (RFC-0001)
# POSIX-pure; all meaning lives in dotfiles.

set -eu

read_if() {
  file=$1
  [ -f "$file" ] || return 0
  dir=$(dirname "$file")
  while IFS= read -r line; do
    case "$line" in
      @include\ *)
        inc=${line#@include }
        if [ -f "$inc" ]; then
          cat "$inc"
        elif [ -f "$dir/$inc" ]; then
          cat "$dir/$inc"
        fi
        ;;
      *)
        printf '%s\n' "$line"
        ;;
    esac
  done < "$file"
}
norm() { sed 's/\r$//'; }

INPUT_ARG=""
OUT_ARG=""
ERR_ARG=""
INCLUDE_FILE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env=*)
      DOT_ENV=${1#--env=}
      ;;
    --atom=*)
      DOT_ATOM=${1#--atom=}
      ;;
    --manifest=*)
      DOT_MANIFEST=${1#--manifest=}
      ;;
    --genesis=*)
      DOT_GENESIS=${1#--genesis=}
      ;;
    --schema=*)
      DOT_SCHEMA=${1#--schema=}
      ;;
    --include=*)
      INCLUDE_FILE=${1#--include=}
      ;;
    --ignore=*)
      DOT_IGNORE=${1#--ignore=}
      ;;
    --sequence=*)
      DOT_SEQUENCE=${1#--sequence=}
      ;;
    --stdin=*)
      INPUT_ARG=${1#--stdin=}
      ;;
    --stdout=*)
      OUT_ARG=${1#--stdout=}
      ;;
    --stderr=*)
      ERR_ARG=${1#--stderr=}
      ;;
    *)
      INPUT_ARG=$1
      ;;
  esac
  shift
done

# Axiom: ∅! = 1 — empty input yields identity
if [ -z "$INPUT_ARG" ] && [ -t 0 ]; then
  echo "∅! = 1"
  exit 0
fi

apply_include_file() {
  path=$1
  if [ -d "$path" ]; then
    DOT_DIR=$path
    DOT_ENV=${DOT_ENV:-$DOT_DIR/.env}
    DOT_ATOM=${DOT_ATOM:-$DOT_DIR/.atom}
    DOT_MANIFEST=${DOT_MANIFEST:-$DOT_DIR/.manifest}
    DOT_GENESIS=${DOT_GENESIS:-$DOT_DIR/.genesis}
    DOT_SCHEMA=${DOT_SCHEMA:-$DOT_DIR/.schema}
    DOT_INCLUDE=${DOT_INCLUDE:-$DOT_DIR/.include}
    DOT_IGNORE=${DOT_IGNORE:-$DOT_DIR/.ignore}
    DOT_SEQUENCE=${DOT_SEQUENCE:-$DOT_DIR/.sequence}
    return 0
  fi
  [ -f "$path" ] || return 0
  while IFS= read -r line; do
    case "$line" in
      \#*|'') continue ;;
      env\ *)
        DOT_ENV=${line#env }
        ;;
      atom\ *)
        DOT_ATOM=${line#atom }
        ;;
      manifest\ *)
        DOT_MANIFEST=${line#manifest }
        ;;
      genesis\ *)
        DOT_GENESIS=${line#genesis }
        ;;
      schema\ *)
        DOT_SCHEMA=${line#schema }
        ;;
      include\ *)
        DOT_INCLUDE=${line#include }
        ;;
      ignore\ *)
        DOT_IGNORE=${line#ignore }
        ;;
      sequence\ *)
        DOT_SEQUENCE=${line#sequence }
        ;;
      *)
        if [ -d "$line" ]; then
          DOT_DIR=$line
          DOT_ENV=${DOT_ENV:-$DOT_DIR/.env}
          DOT_ATOM=${DOT_ATOM:-$DOT_DIR/.atom}
          DOT_MANIFEST=${DOT_MANIFEST:-$DOT_DIR/.manifest}
          DOT_GENESIS=${DOT_GENESIS:-$DOT_DIR/.genesis}
          DOT_SCHEMA=${DOT_SCHEMA:-$DOT_DIR/.schema}
          DOT_INCLUDE=${DOT_INCLUDE:-$DOT_DIR/.include}
          DOT_IGNORE=${DOT_IGNORE:-$DOT_DIR/.ignore}
          DOT_SEQUENCE=${DOT_SEQUENCE:-$DOT_DIR/.sequence}
        fi
        ;;
    esac
  done < "$path"
}

DOT_DIR=${DOT_DIR:-.}

DOT_ENV=${DOT_ENV:-$DOT_DIR/.env}
DOT_ATOM=${DOT_ATOM:-$DOT_DIR/.atom}
DOT_MANIFEST=${DOT_MANIFEST:-$DOT_DIR/.manifest}
DOT_GENESIS=${DOT_GENESIS:-$DOT_DIR/.genesis}
DOT_SCHEMA=${DOT_SCHEMA:-$DOT_DIR/.schema}
DOT_INCLUDE=${DOT_INCLUDE:-$DOT_DIR/.include}
DOT_IGNORE=${DOT_IGNORE:-$DOT_DIR/.ignore}
DOT_SEQUENCE=${DOT_SEQUENCE:-$DOT_DIR/.sequence}

if [ -n "$INCLUDE_FILE" ]; then
  apply_include_file "$INCLUDE_FILE"
fi

ENV=$(read_if "$DOT_ENV" | norm)
ATOM=$(read_if "$DOT_ATOM" | norm)
MANIFEST=$(read_if "$DOT_MANIFEST" | norm)
GENESIS=$(read_if "$DOT_GENESIS" | norm)
SCHEMA=$(read_if "$DOT_SCHEMA" | norm)
INCLUDE=$(read_if "$DOT_INCLUDE" | norm)
IGNORE=$(read_if "$DOT_IGNORE" | norm)
SEQUENCE=$(read_if "$DOT_SEQUENCE" | norm)

if [ -n "$ERR_ARG" ]; then
  exec 2> "$ERR_ARG"
fi

if [ -n "$INPUT_ARG" ]; then
  INPUT=$(cat "$INPUT_ARG" | norm)
else
  INPUT=$(cat - | norm)
fi

PHASES=$(printf '%s\n' "$SEQUENCE" | sed '/^$/d')
if [ -z "$PHASES" ]; then
  PHASES="env atom manifest genesis schema include ignore"
fi

STREAM="$INPUT"

for P in $PHASES; do
  case "$P" in
    env)
      [ -n "$ENV" ] && STREAM=$(printf '%s\n' "$STREAM" | sed "$ENV") ;;
    atom)
      [ -n "$ATOM" ] && STREAM=$(printf '%s\n' "$STREAM" | sed "$ATOM") ;;
    manifest)
      [ -n "$MANIFEST" ] && STREAM=$(printf '%s\n' "$STREAM" | sed "$MANIFEST") ;;
    genesis)
      [ -n "$GENESIS" ] && STREAM=$(printf '%s\n' "$STREAM" | sed "$GENESIS") ;;
    schema)
      if [ -n "$SCHEMA" ]; then
        printf '%s\n' "$STREAM" | grep -Eq "$SCHEMA" || {
          echo "schema violation" >&2
          exit 1
        }
      fi ;;
    include)
      [ -n "$INCLUDE" ] && STREAM=$(printf '%s\n' "$STREAM" | grep -E "$INCLUDE") ;;
    ignore)
      [ -n "$IGNORE" ] && STREAM=$(printf '%s\n' "$STREAM" | grep -Ev "$IGNORE") ;;
  esac
done

if [ -n "$OUT_ARG" ]; then
  printf '%s\n' "$STREAM" > "$OUT_ARG"
else
  printf '%s\n' "$STREAM"
fi
