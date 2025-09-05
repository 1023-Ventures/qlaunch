import * as vscode from "vscode";
import { getNonce } from "./utilities/getNonce";
import { logger } from "./utilities/logger";
import { log } from "console";

export class WorkspaceInfoProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "aiQuickLaunchView";

    private _view?: vscode.WebviewView;
    private _watchers: vscode.FileSystemWatcher[] = [];
    private _watchedPatterns: string[] = [
        "**/*.{js,ts,jsx,tsx,json,md}", // Default patterns
        "**/package.json",
        "**/.env*",
        "**/README*",
    ];
    
    // Throttling properties to prevent excessive event firing
    private _documentChangeTimeout: NodeJS.Timeout | undefined;
    private _lastDocumentChangeTime = 0;
    private _isProcessingDocumentChange = false;
    private readonly DOCUMENT_CHANGE_THROTTLE_MS = 500; // 500ms throttle

    constructor(private readonly _extensionUri: vscode.Uri) {
        this._setupFileWatchers();
        this._setupWorkspaceWatchers();
    }

    private _setupFileWatchers() {
        // Clean up existing watchers
        this._watchers.forEach(watcher => watcher.dispose());
        this._watchers = [];

        logger.info(`Setting up file watchers for ${this._watchedPatterns.length} patterns`);

        // Create watchers for each pattern
        this._watchedPatterns.forEach(pattern => {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);

            // Watch for file creation, deletion, and changes
            watcher.onDidCreate(uri => this._onFileSystemChange("created", uri, pattern));
            watcher.onDidDelete(uri => this._onFileSystemChange("deleted", uri, pattern));
            watcher.onDidChange(uri => this._onFileSystemChange("changed", uri, pattern));

            this._watchers.push(watcher);
        });

        logger.debug(`File watchers setup complete - watching patterns: ${this._watchedPatterns.join(", ")}`);
    }

    private _setupWorkspaceWatchers() {
        // Watch for workspace folder changes
        vscode.workspace.onDidChangeWorkspaceFolders(event => {
            this._onWorkspaceFoldersChange(event);
        });

        // Watch for active editor changes
        vscode.window.onDidChangeActiveTextEditor(editor => {
            this._onActiveEditorChange(editor);
        });

        // Watch for text document changes
        vscode.workspace.onDidChangeTextDocument(event => {
            // Only process if it's the active document and has meaningful changes
            if (vscode.window.activeTextEditor?.document === event.document && 
                event.contentChanges.length > 0 && 
                event.contentChanges.some(change => change.text.length > 0 || change.rangeLength > 0)) {
                this._onActiveDocumentChange(event);
            }
        });
    }

    private _onFileSystemChange(type: "created" | "deleted" | "changed", uri: vscode.Uri, pattern: string) {
        logger.debug(`File system change detected: ${type} - ${uri.fsPath} (pattern: ${pattern})`);
        if (this._view) {
            this._view.webview.postMessage({
                type: "fileSystemChange",
                data: {
                    type,
                    uri: uri.fsPath,
                    pattern,
                    timestamp: Date.now(),
                },
            });
        }
    }

    private _onWorkspaceFoldersChange(event: vscode.WorkspaceFoldersChangeEvent) {
        logger.info(`Workspace folders changed - Added: ${event.added.length}, Removed: ${event.removed.length}`);
        if (this._view) {
            this._view.webview.postMessage({
                type: "workspaceFoldersChange",
                data: {
                    added: event.added.map(folder => ({
                        name: folder.name,
                        uri: folder.uri.fsPath,
                        scheme: folder.uri.scheme,
                    })),
                    removed: event.removed.map(folder => ({
                        name: folder.name,
                        uri: folder.uri.fsPath,
                        scheme: folder.uri.scheme,
                    })),
                    timestamp: Date.now(),
                },
            });

            // Refresh workspace info
            this._getWorkspaceInfo();
        }
    }

    private _onActiveEditorChange(editor: vscode.TextEditor | undefined) {
        const fileName = editor ? editor.document.fileName : "none";
        logger.debug(`Active editor changed to: ${fileName}`);

        if (this._view) {
            this._view.webview.postMessage({
                type: "activeEditorChange",
                data: {
                    activeFile: editor
                        ? {
                              fileName: editor.document.fileName,
                              languageId: editor.document.languageId,
                              isUntitled: editor.document.isUntitled,
                              isDirty: editor.document.isDirty,
                          }
                        : null,
                    timestamp: Date.now(),
                },
            });
        }
    }

    private _onActiveDocumentChange(event: vscode.TextDocumentChangeEvent) {
        const now = Date.now();
        
        // Skip if we're already processing a change
        if (this._isProcessingDocumentChange) {
            return;
        }
        
        // Clear any existing timeout
        if (this._documentChangeTimeout) {
            clearTimeout(this._documentChangeTimeout);
        }
        
        // Throttle rapid changes - only process if enough time has passed since last change
        if (now - this._lastDocumentChangeTime < this.DOCUMENT_CHANGE_THROTTLE_MS) {
            // Debounce: schedule to fire later if changes keep coming
            this._documentChangeTimeout = setTimeout(() => {
                this._sendDocumentChangeMessage(event);
            }, this.DOCUMENT_CHANGE_THROTTLE_MS);
            return;
        }
        
        // Fire immediately if enough time has passed
        this._lastDocumentChangeTime = now;
        this._sendDocumentChangeMessage(event);
    }
    
    private _sendDocumentChangeMessage(event: vscode.TextDocumentChangeEvent) {
        this._isProcessingDocumentChange = true;
        
        logger.debug(`Active document changed: ${event.document.fileName} (${event.contentChanges.length} changes)`);

        if (this._view) {
            this._view.webview.postMessage({
                type: "activeDocumentChange",
                data: {
                    fileName: event.document.fileName,
                    isDirty: event.document.isDirty,
                    changeCount: event.contentChanges.length,
                    timestamp: Date.now(),
                },
            });
        }
        
        // Reset processing flag after a short delay
        setTimeout(() => {
            this._isProcessingDocumentChange = false;
        }, 50);
    }

    private _updateWatchPatterns(patterns: string[]) {
        logger.info(`Updating watch patterns to: ${patterns.join(", ")}`);
        this._watchedPatterns = patterns;
        this._setupFileWatchers();

        if (this._view) {
            this._view.webview.postMessage({
                type: "watchPatternsUpdated",
                data: {
                    patterns: this._watchedPatterns,
                    timestamp: Date.now(),
                },
            });
        }
    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        logger.info("Resolving webview view for workspace info");
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        logger.debug("Webview HTML loaded and options configured");

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            logger.debug(`Received message from webview: ${data.type}`);
            switch (data.type) {
                case "getWorkspaceInfo":
                    this._getWorkspaceInfo();
                    break;
                case "webviewReady":
                    // Automatically send workspace info when webview is ready
                    this._getWorkspaceInfo();
                    this._sendWatchPatterns();
                    break;
                case "updateWatchPatterns":
                    if (data.patterns && Array.isArray(data.patterns)) {
                        this._updateWatchPatterns(data.patterns);
                    }
                    break;
                case "getWatchPatterns":
                    this._sendWatchPatterns();
                    break;
                case "switchToExplorer":
                    this._switchToExplorer();
                    break;
                case "openWithOS":
                    if (data.filePath) {
                        this._openWithOS(data.filePath, data.openMethod || 'default');
                    }
                    break;
                case "openTerminalAt":
                    if (data.folderPath) {
                        this._openTerminalAt(data.folderPath);
                    }
                    break;
            }
        });

        // Also send workspace info immediately when view becomes visible
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                logger.debug("Webview became visible, refreshing workspace info");
                this._getWorkspaceInfo();
            }
        });
    }

    private _sendWatchPatterns() {
        if (this._view) {
            logger.debug(`Sending watch patterns to webview: ${this._watchedPatterns.length} patterns, ${this._watchers.length} watchers`);
            this._view.webview.postMessage({
                type: "watchPatterns",
                data: {
                    patterns: this._watchedPatterns,
                    watcherCount: this._watchers.length,
                    timestamp: Date.now(),
                },
            });
        } else {
            logger.warn("Cannot send watch patterns - webview not available");
        }
    }

    private _switchToExplorer() {
        logger.info("Switching to VS Code explorer view");
        vscode.commands.executeCommand("workbench.view.explorer");
    }

    private async _openWithOS(filePath: string, openMethod: string = 'default') {
        try {
            logger.info(`Opening file: ${filePath} with method: ${openMethod}`);
            
            // Convert the file path to a URI
            const fileUri = vscode.Uri.file(filePath);
            
            switch (openMethod) {
                case 'default':
                    // Open with the operating system's default application
                    await vscode.env.openExternal(fileUri);
                    logger.debug(`Successfully opened ${filePath} with OS default application`);
                    break;
                    
                case 'vscode':
                    // Open in VS Code
                    await vscode.window.showTextDocument(fileUri);
                    logger.debug(`Successfully opened ${filePath} in VS Code`);
                    break;
                    
                case 'explorer':
                case 'folder':
                    // Open containing folder
                    const folderUri = vscode.Uri.file(require('path').dirname(filePath));
                    await vscode.env.openExternal(folderUri);
                    logger.debug(`Successfully opened folder containing ${filePath}`);
                    break;
                    
                case 'vscode-terminal':
                    // Open a new VS Code terminal at the file's directory
                    const terminalPath = require('path').dirname(filePath);
                    const terminal = vscode.window.createTerminal({
                        name: `Terminal - ${require('path').basename(terminalPath)}`,
                        cwd: terminalPath
                    });
                    terminal.show();
                    logger.debug(`Successfully opened terminal at ${terminalPath}`);
                    break;
                    
                default:
                    // Default to OS default application
                    await vscode.env.openExternal(fileUri);
                    logger.debug(`Successfully opened ${filePath} with OS default application (fallback)`);
            }
            
        } catch (error) {
            logger.error(`Failed to open file: ${filePath} with method: ${openMethod}`, error);
            
            // Show error message to user
            vscode.window.showErrorMessage(
                `Failed to open file with ${openMethod} method: ${filePath}. ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private _openTerminalAt(folderPath: string) {
        try {
            logger.info(`Opening terminal at: ${folderPath}`);
            
            const terminal = vscode.window.createTerminal({
                name: `Terminal - ${require('path').basename(folderPath)}`,
                cwd: folderPath
            });
            terminal.show();
            
            logger.debug(`Successfully opened terminal at ${folderPath}`);
        } catch (error) {
            logger.error(`Failed to open terminal at: ${folderPath}`, error);
            
            // Show error message to user
            vscode.window.showErrorMessage(
                `Failed to open terminal at: ${folderPath}. ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    public dispose() {
        logger.info(`Disposing WorkspaceInfoProvider - cleaning up ${this._watchers.length} file watchers`);
        
        // Clean up file watchers
        this._watchers.forEach(watcher => watcher.dispose());
        this._watchers = [];
        
        // Clean up document change timeout and reset flags
        if (this._documentChangeTimeout) {
            clearTimeout(this._documentChangeTimeout);
            this._documentChangeTimeout = undefined;
        }
        this._isProcessingDocumentChange = false;
    }

    private async _findDeployFolders(): Promise<string[]> {
        const deployFolders: string[] = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            return deployFolders;
        }

        for (const workspaceFolder of workspaceFolders) {
            try {
                // Use VS Code's file system API to find .deploy folders
                const files = await vscode.workspace.fs.readDirectory(workspaceFolder.uri);
                
                for (const [name, type] of files) {
                    if (name === '.deploy' && type === vscode.FileType.Directory) {
                        const deployPath = vscode.Uri.joinPath(workspaceFolder.uri, name);
                        deployFolders.push(deployPath.fsPath);
                    }
                }
                
                // Also search recursively for .deploy folders in subdirectories
                const pattern = new vscode.RelativePattern(workspaceFolder, '**/.deploy');
                const foundFiles = await vscode.workspace.findFiles(pattern);
                
                // Filter to only directories (findFiles can return both files and directories)
                for (const file of foundFiles) {
                    try {
                        const stat = await vscode.workspace.fs.stat(file);
                        if (stat.type === vscode.FileType.Directory) {
                            deployFolders.push(file.fsPath);
                        }
                    } catch (error) {
                        // Ignore errors for individual files
                        logger.debug(`Could not stat file ${file.fsPath}: ${error}`);
                    }
                }
            } catch (error) {
                logger.warn(`Error searching for .deploy folders in ${workspaceFolder.uri.fsPath}: ${error}`);
            }
        }
        
        // Remove duplicates
        return [...new Set(deployFolders)];
    }

    private _getWorkspaceInfo() {
        if (!this._view) {
            logger.warn("Cannot get workspace info - webview not available");
            return;
        }

        logger.debug("Gathering workspace information");
        const workspaces = vscode.workspace.workspaceFolders;
        const activeEditor = vscode.window.activeTextEditor;

        logger.debug(`----> Found ${workspaces?.length || 0} workspace folders, active editor: ${activeEditor?.document.fileName || "none"}`);

        const workspaceInfo = {
            workspaceFolders:
                workspaces?.map(folder => ({
                    name: folder.name,
                    uri: folder.uri.fsPath,
                    scheme: folder.uri.scheme,
                })) || [],
            activeFile: activeEditor
                ? {
                      fileName: activeEditor.document.fileName,
                      languageId: activeEditor.document.languageId,
                      isUntitled: activeEditor.document.isUntitled,
                      isDirty: activeEditor.document.isDirty,
                  }
                : null,

            workspaceName: vscode.workspace.name || "No workspace",
            workspaceFile: vscode.workspace.workspaceFile ? vscode.workspace.workspaceFile.fsPath : null,
            
            extensions: vscode.extensions.all
                .filter(ext => ext.isActive)
                .map(ext => ({
                    id: ext.id,
                    displayName: ext.packageJSON.displayName || ext.id,
                    version: ext.packageJSON.version,
                })),
        };

        vscode.workspace.findFiles("**/*.sln").then(slnResults => {
            vscode.workspace.findFiles("**/*.code-workspace").then(wsResults => {
                this._findDeployFolders().then(deployFolders => {
                    logger.debug(`Sending workspace info to webview: ${workspaceInfo.workspaceFolders.length} folders, ${workspaceInfo.extensions.length} active extensions, ${deployFolders.length} deploy folders`);

                    this._view && this._view.webview.postMessage({
                        type: "workspaceInfo",
                        data: {
                            ...workspaceInfo,
                            slnFiles: slnResults.map(uri => uri.fsPath),
                            codeWorkspaceFiles: wsResults.map(uri => uri.fsPath),
                            deployFolders: deployFolders,
                            timestamp: Date.now(),
                        },
                    });
                });
            });
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "dist", "webview.js"));

        // Do the same for the stylesheet.
        const styleTailwindUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "dist", "index.css"));
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
    const styleCodiconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "codicon.css"));

    logger.debug("Webview URIs generated", {
        scriptUri,
        styleTailwindUri,
        styleResetUri,
        styleVSCodeUri,
        styleCodiconUri
    });
    
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; font-src ${webview.cspSource};">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleTailwindUri}" rel="stylesheet">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleCodiconUri}" rel="stylesheet">
                <title>Workspace Info</title>
            </head>
            <body>
                <div id="root">
                    <div style="padding: 20px; color: var(--vscode-foreground);">
                        <h2>Loading React App...</h2>
                        <p>If this persists, React may not be loading properly.</p>
                    </div>
                </div>
                
                <script nonce="${nonce}">
                    // Set up the VS Code API for React to use
                    window.vscode = acquireVsCodeApi();
                    console.log('VS Code API acquired, loading React...');
                    
                    // Comprehensive process polyfill for webview
                    if (typeof window.process === 'undefined') {
                        console.log('Setting up process polyfill...');
                        window.process = {
                            env: {},
                            version: 'v16.0.0',
                            platform: 'browser',
                            argv: [],
                            cwd: function() { return '/'; },
                            browser: true,
                            nextTick: function(fn) { setTimeout(fn, 0); },
                            emitWarning: function() {},
                            exit: function() {},
                            hrtime: function() { return [0, 0]; }
                        };
                    }
                    
                    // Also set global.process for compatibility
                    if (typeof window.global === 'undefined') {
                        window.global = window;
                    }
                    if (typeof global !== 'undefined' && typeof global.process === 'undefined') {
                        global.process = window.process;
                    }
                    
                    console.log('Process polyfill ready:', typeof window.process, window.process);
                    
                    // Error handling
                    window.addEventListener('error', function(e) {
                        console.error('Webview error:', e.error, e.filename, e.lineno);
                        document.getElementById('root').innerHTML = 
                            '<div style="padding: 20px; color: var(--vscode-errorForeground);"><h3>Error loading React:</h3><p>' + e.message + '</p></div>';
                    });
                    
                    window.addEventListener('unhandledrejection', function(e) {
                        console.error('Unhandled promise rejection:', e.reason);
                    });
                </script>
                
                <script nonce="${nonce}" src="${scriptUri}"></script>
                
                <script nonce="${nonce}">
                    // Check if React loaded after a delay
                    setTimeout(() => {
                        const root = document.getElementById('root');
                        if (root.innerHTML.includes('Loading React App')) {
                            console.warn('React app may not have loaded properly');
                            root.innerHTML = '<div style="padding: 20px; color: var(--vscode-foreground);"><h2>React Loading Issue</h2><p>The React app did not load. Check console for errors.</p></div>';
                        } else {
                            console.log('React app loaded successfully');
                        }
                    }, 3000);
                </script>
            </body>
            </html>`;
    }
}
