#!/bin/bash
clear
if [ -e artisan ]
then
    php artisan serve --host=0.0.0.0 --port=8000
else
    echo "Laravel Artisan not found. Laravel may not be installed."
fi