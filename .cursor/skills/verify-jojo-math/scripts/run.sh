#!/usr/bin/env bash
# launch, doctor, drive, cleanup. Evidence is left in place.
set -euo pipefail
DIR=$(cd "$(dirname "$0")" && pwd)
"$DIR/launch.sh"
"$DIR/doctor.sh"
"$DIR/drive.sh"
"$DIR/cleanup.sh"
echo "evidence remains in $DIR/../evidence"
