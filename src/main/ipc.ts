import { ipcMain, shell } from 'electron';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { spawn } from 'child_process';

// Define ipc main to fetch entries from the state file
ipcMain.handle('entries', async (_, stateFilePath) => {
  console.log('Fetching entries from state file:', stateFilePath);

  // Open the state file
  const db = await open({ filename: stateFilePath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
  const rows = await db.get("SELECT value FROM ItemTable WHERE key='history.recentlyOpenedPathsList'");
  await db.close();

  if (rows) {
    // Parse the value and return the entries
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

// Verify the state file
ipcMain.handle('verify-state-file', async (_event, filePath: string) => {
  try {
    const db = await open({ filename: filePath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
    const rows = await db.get("SELECT value FROM ItemTable WHERE key='history.recentlyOpenedPathsList'");
    await db.close();

    if (rows) {
      const result = JSON.parse(rows.value) as { entries: any[] } | null;
      return result?.entries && Array.isArray(result.entries);
    }
  } catch (err: any) {
    console.error(err);
    return err.message;
  }

  return false;
});

// Open url in default browser
ipcMain.handle('open-url', async (_, url) => {
  try {
    await shell.openExternal(url);
  } catch (err: any) {
    console.error(err);
  }
});
