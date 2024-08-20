import { useEffect, useRef, useState } from 'react';
import basic from './styles/basic.module.css';
import DialogBox from './components/DialogBox';
import { VariableSizeList as List } from 'react-window';
import Fuse from 'fuse.js';
import { GitHubIcon, PlusIcon } from './components/Icons';

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
      <input className="search-input" type="text" placeholder="Search" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
      <List height={510} width={'100%'} itemCount={filteredEntries.length} itemSize={() => 35}>
        {EntryRow}
      </List>

      {filteredEntries.length === 0 && <div>No entries found</div>}

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

      <div className="statusbar">
        <div>Folders {entries.length}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button title="Configure" onClick={openDialog}>
            <PlusIcon />
          </button>
          <button title="Guasam - Github" onClick={gotoGithub}>
            <GitHubIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
