#!/bin/bash

# Change to the project directory
cd /Desktop/Projects/Sales4x/sales4x-be

# Run the backup script
node scripts/backup.js >> logs/backup.log 2>&1 