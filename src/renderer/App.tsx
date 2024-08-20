import { useEffect, useRef, useState } from 'react';
import basic from './styles/basic.module.css';
import DialogBox from './components/DialogBox';
import { VariableSizeList as List } from 'react-window';
import Fuse from 'fuse.js';

export default function App() {
  const [entries, setEntries] = useState<ProjectEntryWithMeta[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stateFilePath, setStateFilePath] = useState('');
  const [stateFileError, setStateFileError] = useState('');
  const isInitialized = useRef(false);
  const [filterText, setFilterText] = useState('');

  const fuse = new Fuse(entries, { keys: ['folderName'], threshold: 0.3 });
  const filteredEntries = filterText ? fuse.search(filterText).map((result) => result.item) : entries;

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
    const data = (await window.api.invoke('entries', filePath)) as ProjectEntryWithMeta[];
    data.forEach((entry) => {
      entry.folderName = getBaseFolderName(entry.folderUri);
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
    setStateFilePath(filePath);
  };

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setStateFileError('');
    setIsDialogOpen(false);
  };

  const EntryRow = ({ index, style }) => {
    const entry = filteredEntries[index];
    return (
      <div style={style} className="entry" key={index}>
        <span onClick={() => openFolderInCode(entry['folderUri'])}>{entry.folderName}</span>
        {entry.isDevContainer || entry.isWSL || entry.isSSH ? (
          <span className="entry-badge">
            {entry.isDevContainer ? 'Dev Container' : ''}
            {entry.isWSL ? 'WSL' : ''}
            {entry.isSSH ? 'Remote SSH' : ''}
          </span>
        ) : null}
      </div>
    );
  };

  const gotoGithub = async () => {
    await window.api.invoke('open-url', 'https://github.com/guasam');
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
      <input type="text" placeholder="Search" value={filterText} onChange={(e) => setFilterText(e.target.value)} />

      <List height={490} width={'100%'} itemCount={filteredEntries.length} itemSize={() => 35}>
        {EntryRow}
      </List>

      {filteredEntries.length === 0 && <div>No entries found</div>}

      <div className="statusbar">
        <div>Folders {entries.length}</div>
        <div>
          <span title="Guasam - Github" onClick={gotoGithub}>
            <GitHubIcon />
          </span>
        </div>
      </div>
    </div>
  );
}

const GitHubIcon = () => (
  <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
