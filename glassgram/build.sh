#!/usr/bin/env bash
# Builds GlassGram: fetches the pinned Telegram for Android sources, applies glassgram.patch, assembles the apk.
#
# Needs: JDK 17+, Android SDK with build-tools 36.0.0, platform 36, NDK 27.2.12479018, CMake 3.22.1
#        (ANDROID_HOME must point at it), and your own API keys from https://my.telegram.org:
#   GLASSGRAM_API_ID=12345 GLASSGRAM_API_HASH=abcdef... ./glassgram/build.sh
# Optional: GLASSGRAM_ABIS (default arm64-v8a,armeabi-v7a), WORK (checkout dir, default ./.glassgram-build)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
UPSTREAM_COMMIT="$(cat "$HERE/UPSTREAM_COMMIT")"
WORK="${WORK:-$HERE/../.glassgram-build}"
ABIS="${GLASSGRAM_ABIS:-arm64-v8a,armeabi-v7a}"
OUT="${OUT:-$HERE/../glassgram-out}"

if [ -z "${GLASSGRAM_API_ID:-}" ] || [ -z "${GLASSGRAM_API_HASH:-}" ]; then
  echo "warning: GLASSGRAM_API_ID / GLASSGRAM_API_HASH are not set - the apk will build but cannot log in" >&2
fi
: "${ANDROID_HOME:?set ANDROID_HOME to your Android SDK}"

mkdir -p "$WORK" "$OUT"
TG="$WORK/tg"
if [ ! -d "$TG/.git" ]; then
  git init -q "$TG"
  git -C "$TG" remote add origin https://github.com/DrKLO/Telegram.git
fi
cd "$TG"
git fetch -q --depth 1 origin "$UPSTREAM_COMMIT"
git reset -q --hard FETCH_HEAD
git clean -q -fd
git submodule update --init --recursive --depth 1 --jobs 8
git apply --whitespace=nowarn "$HERE/glassgram.patch"
echo "sdk.dir=$ANDROID_HOME" > local.properties

./gradlew --no-daemon :TMessagesProj_App:assembleAfatRelease -PGLASSGRAM_ABIS="$ABIS"

VERSION="$(grep '^APP_VERSION_NAME=' gradle.properties | cut -d= -f2)"
cp TMessagesProj_App/build/outputs/apk/afat/release/app.apk "$OUT/GlassGram-$VERSION.apk"
echo "built $OUT/GlassGram-$VERSION.apk"
