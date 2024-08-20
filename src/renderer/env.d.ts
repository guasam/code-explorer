/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ProjectEntry {
  folderUri: string;
  fileUri: string;
  label: string;
  remoteAuthority: string;
  workspace: {
    id: string;
    configPath?: string;
  };
}

interface ProjectEntryWithMeta extends ProjectEntry {
  folderName: string;
  isDevContainer?: boolean;
  isWSL?: boolean;
  isSSH?: boolean;
}
