import { WorkspaceFolder, ActiveFile, Extension } from '../WorkspaceInfoPanel';

export interface WorkspaceInfo {
    workspaceName: string;
    workspaceFile: string | null;
    
    workspaceFolders: WorkspaceFolder[];
    activeFile: ActiveFile | null;
    extensions: Extension[];
    timestamp: number;
    slnFiles: string[];
    codeWorkspaceFiles: string[];
    deployFolders: string[];
}
