const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
require('dotenv').config();

// Get the absolute path of the project root
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const DB_NAME = process.env.DB_NAME || 'defaultdb';
const DB_USER = process.env.DB_USERNAME || 'avnadmin';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || 'mysql-361e9fc0-krafay92-99d8.i.aivencloud.com';
const DB_PORT = process.env.DB_PORT || '12200';
const BACKUP_DIR = path.join(projectRoot, 'backups');
const LOG_DIR = path.join(projectRoot, 'logs');

// Create directories if they don't exist
[BACKUP_DIR, LOG_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Generate backup filename with timestamp
const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
const backupFileName = `backup_${timestamp}.sql`;
const backupPath = path.join(BACKUP_DIR, backupFileName);
const logPath = path.join(LOG_DIR, 'backup.log');

// Create a temporary config file for secure password handling
const configPath = path.join(projectRoot, 'mysql_backup.cnf');
const configContent = `[client]
user=${DB_USER}
password=${DB_PASSWORD}
host=${DB_HOST}
port=${DB_PORT}
ssl-mode=REQUIRED`;

// Write the config file
fs.writeFileSync(configPath, configContent, { mode: 0o600 }); // Set secure permissions

// Create backup command for MySQL with improved options
const backupCommand = `mysqldump --defaults-file=${configPath} --single-transaction --routines --triggers --events --set-gtid-purged=OFF ${DB_NAME} > ${backupPath}`;

// Execute backup
exec(backupCommand, (error, stdout, stderr) => {
    const logMessage = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] `;
    
    // Clean up the config file
    try {
        fs.unlinkSync(configPath);
    } catch (unlinkError) {
        console.error(`Failed to remove config file: ${unlinkError.message}`);
    }

    if (error) {
        const errorMsg = `Backup failed: ${error.message}`;
        console.error(errorMsg);
        fs.appendFileSync(logPath, logMessage + errorMsg + '\n');
        return;
    }
    if (stderr) {
        const stderrMsg = `Backup stderr: ${stderr}`;
        console.error(stderrMsg);
        fs.appendFileSync(logPath, logMessage + stderrMsg + '\n');
        return;
    }

    const successMsg = `Backup successful: ${backupPath}`;
    console.log(successMsg);
    fs.appendFileSync(logPath, logMessage + successMsg + '\n');

    // Clean up old backups (keep last 7 days)
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        const now = moment();
        
        files.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const fileStat = fs.statSync(filePath);
            const fileDate = moment(fileStat.mtime);
            
            if (now.diff(fileDate, 'days') > 7) {
                fs.unlinkSync(filePath);
                const deleteMsg = `Deleted old backup: ${file}`;
                console.log(deleteMsg);
                fs.appendFileSync(logPath, logMessage + deleteMsg + '\n');
            }
        });
    } catch (cleanupError) {
        const cleanupMsg = `Cleanup failed: ${cleanupError.message}`;
        console.error(cleanupMsg);
        fs.appendFileSync(logPath, logMessage + cleanupMsg + '\n');
    }
}); 