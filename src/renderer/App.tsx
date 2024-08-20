import { useEffect, useRef, useState } from 'react';
import basic from './styles/basic.module.css';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<ProjectEntry[]>([]);

  // On mount
  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const data = (await window.api.invoke('entries', null)) as ProjectEntryWithMeta[];
    data.forEach((entry) => {
      entry.isDevContainer = entry.folderUri.startsWith('vscode-remote://dev-container');
      entry.isWSL = entry.folderUri.startsWith('vscode-remote://wsl');
      entry.isSSH = entry.folderUri.startsWith('vscode-remote://ssh-remote');
    });

    if (data) {
      setEntries(data);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(file);
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

  return (
    <div className={basic.app}>
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
      <button onClick={() => fileInputRef.current?.click()}>⚙️</button>
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
