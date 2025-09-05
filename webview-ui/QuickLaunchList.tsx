import path from "path";
import { WorkspaceInfo } from "./types/WorkspaceInfo";

// Use the global vscode API that's set up in the HTML
declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

type Props = {
    workspaceInfo: WorkspaceInfo;
};

export function QuickLaunchList({ workspaceInfo }: Props) {

    function findSln(folderName: string) {
        return workspaceInfo.slnFiles.find(sln => path.dirname(sln) === folderName);
    }

    const openFileWithOS = (filePath: string, openMethod: string = 'default') => {
        if (window.vscode) {
            console.log(`Opening file with ${openMethod} method:`, filePath);
            window.vscode.postMessage({
                type: 'openWithOS',
                filePath: filePath,
                openMethod: openMethod
            });
        } else {
            console.error('VS Code API not available');
        }
    };

    const handleFileClick = (filePath: string, event: React.MouseEvent) => {
        // Different actions based on modifier keys
        if (event.metaKey || event.ctrlKey) {
            // Cmd/Ctrl + Click: Open in VS Code
            openFileWithOS(filePath, 'vscode');
        } else if (event.altKey) {
            // Alt + Click: Open containing folder
            openFileWithOS(filePath, 'explorer');
        } else {
            // Normal click: Open with OS default application
            openFileWithOS(filePath, 'default');
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col h-8 justify-center dbg !text-lg" >Quick Launch</div>

            {/* <div className="text-2xl">Workspace: {workspaceInfo.workspaceFile}</div>
            <div className="text-2xl">Name: {workspaceInfo.workspaceName}</div> */}

            {/* Quick Launch Buttons will go here */}
            {workspaceInfo.codeWorkspaceFiles
                .filter(file => file !== workspaceInfo.workspaceFile)
                .sort((a, b) => a.localeCompare(b))
                .map(file => {
                    const folderName = path.dirname(file);
                    const fileName = path.basename(file);
                    const slnFile = findSln(folderName);
                    return (
                        <button 
                            key={file} 
                            onClick={(e) => handleFileClick(file, e)}
                            className="mb-2 p-3 bg-vscode-button text-white rounded text-sm hover:bg-vscode-button-hover transition-colors cursor-pointer text-left w-full flex flex-col gap-1"
                            title={`Click: Open with OS default | Cmd/Ctrl+Click: Open in VS Code | Alt+Click: Open folder`}
                        >
                            <div className="font-semibold">{fileName}</div>
                            {slnFile && (
                                <div className="text-xs opacity-80">Solution: {path.basename(slnFile)}</div>
                            )}
                            <div className="text-xs opacity-60">{folderName}</div>
                            <div className="text-xs opacity-50 mt-1 border-t border-white/20 pt-1">
                                💡 Click: OS default | ⌘+Click: VS Code | ⌥+Click: Folder
                            </div>
                        </button>
                    );
                })}
        </div>
    );
}
