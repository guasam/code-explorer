import { ipcMain } from 'electron';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { spawn } from 'child_process';

ipcMain.handle('entries', async () => {
  const dbpath = 'C:\\Users\\Gary\\Desktop\\state.vscdb';
  const db = await open({ filename: dbpath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
  const rows = await db.get("SELECT value FROM ItemTable WHERE key='history.recentlyOpenedPathsList'");

  if (rows) {
    const result = JSON.parse(rows.value) as { entries: any[] } | null;
    if (result?.entries) {
      return result.entries.filter((entry: any) => entry['folderUri']);
    }
  }

  return null;
});

// Define ipc main to open vscode based on the folderUri
ipcMain.handle('open-vscode', async (_event, folderUri: string) => {
  // Construct the command and arguments
  const command = 'cmd.exe';
  const args = ['/C', `code --folder-uri ${folderUri}`];

  // Create a new process
  spawn(command, args, {
    detached: true,
    shell: false,
    windowsHide: true
  });
});
