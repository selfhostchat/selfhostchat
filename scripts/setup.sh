#!/usr/bin/env bash
# macOS/Linux

set -e

if ! command -v volta &> /dev/null
then
  echo "Installing Volta..."
  curl https://get.volta.sh | bash

  export VOLTA_HOME="$HOME/.volta"
  export PATH="$VOLTA_HOME/bin:$PATH"
fi

volta install node@22.15.1
volta install pnpm@10.3.0

pnpm install

echo "Setup completed."