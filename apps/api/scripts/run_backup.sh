#!/bin/bash

# Change to the project directory
cd /var/www/invoicify/apps/api

# Run the backup script
node scripts/backup.js >> logs/backup.log 2>&1 