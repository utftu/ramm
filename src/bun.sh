#!/bin/bash

if ! command -v unzip &> /dev/null; then
  . /etc/os-release

  if [[ "$ID_LIKE" == *"rhel"* ]]; then
    sudo dnf install -y unzip
  fi
  
  if [[ "$ID" == "ubuntu" ]]; then
    sudo apt update
    sudo apt install -y unzip
  fi
fi

if ! command -v bun &> /dev/null; then
    echo "Installing..."
    
    curl -fsSL https://bun.sh/install | bash
    ln -s "$HOME/.bun/bin/bun" /usr/local/bin/bun
else
    echo "Already installed."
fi