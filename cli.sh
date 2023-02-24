#!/usr/bin/env bash
full_path="$(realpath "$0")"
dir_path="$(dirname $full_path)"
script_path="./lib/cli.js"

node_path="$(which node)" # <== Makes it work on github codespaces 😅

$node_path --experimental-specifier-resolution=node $script_path "$@"
