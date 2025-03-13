#!/bin/bash

# Проверка наличия файла /etc/os-release
if ! command -v unzip &> /dev/null; then
  . /etc/os-release
  echo "Дистрибутив: $NAME"
  
  if [[ "$ID" == "ubuntu" ]]; then
    sudo apt update
    sudo apt install -y unzip
  fi
fi

if ! command -v bun &> /dev/null; then
    echo "Bun не найден. Устанавливаю..."
    
    curl -fsSL https://bun.sh/install | bash
    ln -s "$HOME/.bun/bin/bun" /usr/local/bin/bun
    
    echo "Bun установлен!"
else
    echo "Bun уже установлен."
fi