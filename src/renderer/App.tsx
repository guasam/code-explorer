import { useEffect, useRef, useState } from 'react';
import basic from './styles/basic.module.css';
import DialogBox from './components/DialogBox';

export default function App() {
  const [entries, setEntries] = useState<ProjectEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stateFilePath, setStateFilePath] = useState('');
  const [stateFileError, setStateFileError] = useState('');
  const isInitialized = useRef(false);

  // On mount
  useEffect(() => {
    if (!isInitialized.current) {
      initialize();
      isInitialized.current = true;
    }
  }, []);

  const initialize = async () => {
    // Sanitize whitespace and quotes
    let filePath = localStorage.getItem('stateFilePath');
    filePath = filePath?.trim().replace(/^['"]|['"]$/g, '') || '';

    // Get state file path from localStorage
    setStateFilePath(filePath);

    // Fetch project entries
    fetchEntries(filePath);
  };

  const fetchEntries = async (filePath) => {
    // Fetch entries
    console.log(stateFilePath);
    const data = (await window.api.invoke('entries', filePath)) as ProjectEntryWithMeta[];
    data.forEach((entry) => {
      entry.isDevContainer = entry.folderUri.startsWith('vscode-remote://dev-container');
      entry.isWSL = entry.folderUri.startsWith('vscode-remote://wsl');
      entry.isSSH = entry.folderUri.startsWith('vscode-remote://ssh-remote');
    });

    if (data) {
      setEntries(data);
    }
  };
  const getBaseFolderName = (fileUri: string): string => {
    try {
      const url = new URL(fileUri);
      const decodedPath = decodeURIComponent(url.pathname);
      const baseFolderName = decodedPath.split('/').pop();
      return baseFolderName || '';
    } catch (err) {
      console.error(err);
    }

    return '';
  };

  const openFolderInCode = (folderUri: string) => {
    window.api.invoke('open-vscode', folderUri);
  };

  const applyStateFile = async () => {
    // Clear previous error
    setStateFileError('');

    // no file path provided
    if (!stateFilePath) {
      setStateFileError('Please provide a valid file path');
      return;
    }

    // Sanitize whitespace and quotes
    const filePath = stateFilePath.trim().replace(/^['"]|['"]$/g, '');

    // Verify state file via main ipc
    const result = await window.api.invoke('verify-state-file', filePath);

    // if result is boolean, it means the file path is valid
    const isValid = typeof result === 'boolean' ? result : false;

    if (!isValid) {
      setStateFileError(result);
      return;
    }

    // Persist state file path in localStorage
    localStorage.setItem('stateFilePath', filePath);

    // Log the valid state file path
    console.log('State file validated & applied : ', filePath);

    // Refresh entries
    fetchEntries(filePath);

    // Close the dialog
    closeDialog();

    // Set the state file path
    setStateFilePath(filePath)
  };

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setStateFileError('');
    setIsDialogOpen(false);
  };

  return (
    <div className={basic.app}>
      <DialogBox isOpen={isDialogOpen} onClose={closeDialog} title="Code State File">
        <div>Enter vscode state file (state.vscdb) path:</div>
        <br />
        <textarea spellCheck={false} value={stateFilePath} onChange={(e) => setStateFilePath(e.target.value)}></textarea>
        {stateFileError && <div style={{ color: 'red' }}>{stateFileError}</div>}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="button" onClick={applyStateFile}>
            Apply
          </button>
        </div>
      </DialogBox>
      <button onClick={openDialog}>⚙️</button>
      {entries.map((entry, index) => (
        <div key={index}>
          <a href="#" onClick={() => openFolderInCode(entry['folderUri'])}>
            {getBaseFolderName(entry['folderUri'])}
          </a>
          {entry['isDevContainer'] ? '- Dev Container' : ''}
          {entry['isWSL'] ? '- WSL' : ''}
          {entry['isSSH'] ? '- Remote SSH' : ''}
        </div>
      ))}
    </div>
  );
}
