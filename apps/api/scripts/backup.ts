import { exec } from "child_process";
import path from "path";
import fs from "fs";
import moment from "moment";
import "dotenv/config";

// Get the absolute path of the project root
const projectRoot = path.resolve(import.meta.dirname, '..');

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const PG_DUMP = process.env.PG_DUMP_PATH || 'pg_dump';
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

if (!DATABASE_URL) {
    const errorMsg = 'Backup failed: DATABASE_URL is not set';
    console.error(errorMsg);
    fs.appendFileSync(logPath, `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ` + errorMsg + '\n');
    process.exit(1);
}

// Split the URL into PG* env vars so the password stays out of the command
// line (argv is world-readable via ps; env is not).
const dbUrl = new URL(DATABASE_URL);
const urlSslMode = dbUrl.searchParams.get('sslmode');
const backupCommand = `${PG_DUMP} --no-owner --no-privileges --format=plain --file=${backupPath} ${dbUrl.pathname.slice(1)}`;
const backupEnv = {
    ...process.env,
    PGHOST: dbUrl.hostname,
    PGPORT: dbUrl.port || '5432',
    PGUSER: decodeURIComponent(dbUrl.username),
    PGPASSWORD: decodeURIComponent(dbUrl.password),
    // node-postgres's "no-verify" is not a valid libpq sslmode
    PGSSLMODE: urlSslMode === 'no-verify' ? 'require' : urlSslMode || 'prefer',
};

// Execute backup
exec(backupCommand, { env: backupEnv }, (error, stdout, stderr) => {
    const logMessage = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] `;

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
        const cleanupMsg = `Backup cleanup failed: ${cleanupError.message}`;
        console.error(cleanupMsg);
        fs.appendFileSync(logPath, logMessage + cleanupMsg + '\n');
    }
});
