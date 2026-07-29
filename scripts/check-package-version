if [ "$#" -ne 1 ]; then
  printf 'usage: %s <package-name>\n' "$0" >&2
  exit 1
fi

PACKAGE_NAME="$1"

if ! command -v "$PACKAGE_NAME" > /dev/null 2>&1; then
  printf '\033[0;31m%s is not installed\033[0m\n' "$PACKAGE_NAME" >&2
  exit 1
fi

LOCAL_VERSION="$("$PACKAGE_NAME" --version | awk '{print $NF}')"
LATEST_VERSION="$(npm view "$PACKAGE_NAME" version)"

if [ "$LOCAL_VERSION" = "$LATEST_VERSION" ]; then
  printf '\033[0;32m%s is up to date (%s)\033[0m\n' "$PACKAGE_NAME" "$LOCAL_VERSION"
else
  printf '\033[0;31m%s is not up to date (local: %s, latest: %s)\033[0m\n' "$PACKAGE_NAME" "$LOCAL_VERSION" "$LATEST_VERSION"
fi
