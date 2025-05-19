#!/bin/bash
clear
if [ -e package.json ]
then
    npm run dev --host 127.0.0.1
    if [ $? -eq 0 ]
    then
        echo "Vite started successfully."
    else
        echo "Vite failed to start."
    fi
elif [ -e package-lock.json ]
then
    npm run dev --host  
else
    echo "npm cannot start, package.json not found. Laravel may not be installed."
fi