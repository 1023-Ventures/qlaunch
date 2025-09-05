import React, { useState, useEffect, useCallback } from "react";
import DemoFileTypeButton from "./DemoFileTypeButton";
import { WorkspaceInfo } from "./types/WorkspaceInfo";
import { QuickLaunchList } from "./QuickLaunchList";

export interface WorkspaceFolder {
    name: string;
    uri: string;
    scheme: string;
}

export interface ActiveFile {
    fileName: string;
    languageId: string;
    isUntitled: boolean;
    isDirty: boolean;
}

export interface Extension {
    id: string;
    displayName: string;
    version: string;
}

interface FileSystemChange {
    type: "created" | "deleted" | "changed";
    uri: string;
    pattern: string;
    timestamp: number;
}

interface WatchPatterns {
    patterns: string[];
    watcherCount: number;
    timestamp: number;
}

// Use the global vscode API that's set up in the HTML
declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

const WorkspaceInfoPanel: React.FC = () => {
    const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [watchPatterns, setWatchPatterns] = useState<string[]>([]);
    const [fileChanges, setFileChanges] = useState<FileSystemChange[]>([]);
    const [newPattern, setNewPattern] = useState("");
    const [showWatcherConfig, setShowWatcherConfig] = useState(false);

    const addFileChange = useCallback((change: FileSystemChange) => {
        setFileChanges(prev => [change, ...prev.slice(0, 9)]); // Keep last 10 changes
    }, []);

    useEffect(() => {
        console.log("React component mounted");

        // Listen for messages from the extension
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            console.log("React received message:", message);

            switch (message.type) {
                case "workspaceInfo":
                    setWorkspaceInfo(message.data);
                    setLoading(false);
                    break;
                case "watchPatterns":
                    setWatchPatterns(message.data.patterns);
                    break;
                case "fileSystemChange":
                    addFileChange(message.data);
                    break;
                case "workspaceFoldersChange":
                    // Add to file changes log (workspace info will be updated by the extension)
                    addFileChange({
                        type: "changed",
                        uri: "workspace",
                        pattern: "workspace-folders",
                        timestamp: message.data.timestamp,
                    });
                    // Note: Don't call requestWorkspaceInfo() here to avoid feedback loops
                    // The extension already calls _getWorkspaceInfo() after workspace changes
                    break;
                case "activeEditorChange":
                    setWorkspaceInfo(prev =>
                        prev
                            ? {
                                  ...prev,
                                  activeFile: message.data.activeFile,
                              }
                            : null
                    );
                    break;
                case "activeDocumentChange":
                    addFileChange({
                        type: "changed",
                        uri: message.data.fileName,
                        pattern: "active-document",
                        timestamp: message.data.timestamp,
                    });
                    break;
            }
        };

        window.addEventListener("message", messageHandler);

        // Let the extension know the webview is ready
        if (window.vscode) {
            console.log("Sending webviewReady message");
            window.vscode.postMessage({
                type: "webviewReady",
            });

            // Request workspace info and watch patterns
            requestWorkspaceInfo();
            // requestWatchPatterns();
        } else {
            console.error("VS Code API not available");
            setLoading(false);
        }

        return () => {
            window.removeEventListener("message", messageHandler);
        };
    }, [addFileChange]); // Removed workspaceInfo dependency to prevent endless loop

    const requestWorkspaceInfo = () => {
        if (window.vscode) {
            console.log("Requesting workspace info from React");
            setLoading(true);
            window.vscode.postMessage({
                type: "getWorkspaceInfo",
            });
        }
    };

    const requestWatchPatterns = () => {
        if (window.vscode) {
            window.vscode.postMessage({
                type: "getWatchPatterns",
            });
        }
    };

    const switchToExplorer = () => {
        if (window.vscode) {
            window.vscode.postMessage({
                type: "switchToExplorer",
            });
        }
    };

    const updateWatchPatterns = (patterns: string[]) => {
        if (window.vscode) {
            window.vscode.postMessage({
                type: "updateWatchPatterns",
                patterns,
            });
        }
    };

    const addWatchPattern = () => {
        if (newPattern.trim() && !watchPatterns.includes(newPattern.trim())) {
            const updatedPatterns = [...watchPatterns, newPattern.trim()];
            updateWatchPatterns(updatedPatterns);
            setNewPattern("");
        }
    };

    const removeWatchPattern = (pattern: string) => {
        const updatedPatterns = watchPatterns.filter(p => p !== pattern);
        updateWatchPatterns(updatedPatterns);
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getChangeIcon = (type: string) => {
        switch (type) {
            case "created":
                return "✅";
            case "deleted":
                return "❌";
            case "changed":
                return "📝";
            default:
                return "📄";
        }
    };

    if (loading) {
        return (
            <div className="workspace-info">
                <h2 className="text-lg font-semibold text-vscode-foreground">Loading workspace information...</h2>
            </div>
        );
    }

    if (!workspaceInfo) {
        return (
            <div className="workspace-info">
                <h2 className="text-lg font-semibold text-vscode-foreground mb-4">No workspace information available</h2>
                <button className="px-4 py-2 bg-vscode-button text-white rounded hover:bg-vscode-button-hover transition-colors" onClick={requestWorkspaceInfo}>
                    Refresh
                </button>
            </div>
        );
    }

    const activeExtensionsPanel = (
        <div className="info-section">
            <h3>Active Extensions ({workspaceInfo.extensions.length})</h3>
            <div style={{ maxHeight: "150px", overflow: "auto" }}>
                {workspaceInfo.extensions.slice(0, 5).map((ext, index) => (
                    <div key={index} className="info-item">
                        <div className="info-label">{ext.displayName}</div>
                        <div className="info-value">v{ext.version}</div>
                    </div>
                ))}
                {workspaceInfo.extensions.length > 5 && <p>... and {workspaceInfo.extensions.length - 5} more extensions</p>}
            </div>
        </div>
    );

    const activeFilePanel = (
        <div className="info-section">
            <h3>Active File</h3>
            {workspaceInfo.activeFile ? (
                <div className="info-item">
                    <div className="info-label">File:</div>
                    <div className="info-value">{workspaceInfo.activeFile.fileName}</div>
                    <div className="info-label">Language:</div>
                    <div className="info-value">{workspaceInfo.activeFile.languageId}</div>
                    <div className="info-label">Status:</div>
                    <div className="info-value">
                        {workspaceInfo.activeFile.isUntitled ? "Untitled" : "Saved"}
                        {workspaceInfo.activeFile.isDirty ? " (Modified)" : ""}
                    </div>
                </div>
            ) : (
                <p>No active file</p>
            )}
        </div>
    );

    const workspaceFoldersList = (
        <div className="info-section">
            <h3>Workspace Folders ({workspaceInfo.workspaceFolders.length})</h3>
            {workspaceInfo.workspaceFolders.length === 0 ? (
                <p>No workspace folders open</p>
            ) : (
                <ul>
                    {workspaceInfo.workspaceFolders.map((folder, index) => (
                        <li key={index} className="info-item">
                            <div className="info-label">{folder.name}</div>
                            <div className="info-value">{folder.uri}</div>
                            <div className="info-value">Scheme: {folder.scheme}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    const recentFileChangesSection = (
        <div className="info-section">
            <h3>Recent File Changes ({fileChanges.length})</h3>
            {fileChanges.length === 0 ? (
                <p>No recent file changes</p>
            ) : (
                <div style={{ maxHeight: "200px", overflow: "auto" }}>
                    {fileChanges.map((change, index) => (
                        <div key={index} className="info-item" style={{ fontSize: "12px", marginBottom: "5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>{getChangeIcon(change.type)}</span>
                                <span className="info-label">{change.type.toUpperCase()}</span>
                                <span style={{ color: "var(--vscode-descriptionForeground)" }}>{formatTimestamp(change.timestamp)}</span>
                            </div>
                            <div className="info-value" style={{ fontSize: "11px", marginLeft: "24px" }}>
                                {change.uri.length > 60 ? "..." + change.uri.slice(-60) : change.uri}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--vscode-descriptionForeground)", marginLeft: "24px" }}>Pattern: {change.pattern}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const fileWatcherConfig = showWatcherConfig && (
        <div className="info-section border-t border-vscode-border pt-4">
            <h3 className="text-lg font-semibold mb-3">File Watcher Configuration</h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newPattern}
                    onChange={e => setNewPattern(e.target.value)}
                    placeholder="Enter file pattern (e.g., **/*.js)"
                    className="px-3 py-2 bg-vscode-input border border-vscode-border rounded text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={e => e.key === "Enter" && addWatchPattern()}
                />
                <button className="px-3 py-2 bg-vscode-button text-white rounded text-sm hover:bg-vscode-button-hover transition-colors" onClick={addWatchPattern}>
                    Add Pattern
                </button>
            </div>

            <h4>Current Watch Patterns ({watchPatterns.length}):</h4>
            {watchPatterns.length === 0 ? (
                <p>No watch patterns configured</p>
            ) : (
                <ul>
                    {watchPatterns.map((pattern, index) => (
                        <li key={index} className="info-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <code style={{ background: "var(--vscode-textCodeBlock-background)", padding: "2px 6px", borderRadius: "3px" }}>{pattern}</code>
                            <button
                                onClick={() => removeWatchPattern(pattern)}
                                style={{
                                    background: "var(--vscode-errorButton-background)",
                                    color: "var(--vscode-errorButton-foreground)",
                                    border: "none",
                                    padding: "2px 8px",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                }}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="workspace-info">
            <QuickLaunchList workspaceInfo={workspaceInfo} />

            <div className="info-section">
                <h2 className="text-xl font-bold text-vscode-foreground mb-4">Workspace: {workspaceInfo.workspaceName}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    <button className="px-3 py-1.5 bg-vscode-button text-white rounded text-sm hover:bg-vscode-button-hover transition-colors" onClick={requestWorkspaceInfo}>
                        Refresh Info
                    </button>
                    <button className="px-3 py-1.5 bg-vscode-button text-white rounded text-sm hover:bg-vscode-button-hover transition-colors" onClick={() => setShowWatcherConfig(!showWatcherConfig)}>
                        {showWatcherConfig ? "Hide" : "Show"} File Watchers
                    </button>
                    <button className="px-3 py-1.5 bg-vscode-button text-white rounded text-sm hover:bg-vscode-button-hover transition-colors" onClick={switchToExplorer}>
                        Switch to Explorer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceInfoPanel;
