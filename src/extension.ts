// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WorkspaceInfoProvider } from "./WorkspaceInfoProvider";
import { logger } from "./utilities/logger";

let workspaceInfoProvider: WorkspaceInfoProvider;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the logger to output diagnostic information
    // This line of code will only be executed once when your extension is activated
    logger.info("AI Quick Launch extension is now active!");

    // Register the webview provider first
    workspaceInfoProvider = new WorkspaceInfoProvider(context.extensionUri);
    const webviewDisposable = vscode.window.registerWebviewViewProvider(WorkspaceInfoProvider.viewType, workspaceInfoProvider);
    context.subscriptions.push(webviewDisposable);

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand("ai-quick-launch.helloWorld", () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage("Hello World from AI Quick Launch!");
        logger.info("Hello World command executed");
    });

    // Register the command to open workspace info
    const openWorkspaceInfoCommand = vscode.commands.registerCommand("ai-quick-launch.openWorkspaceInfo", () => {
        vscode.commands.executeCommand("workbench.view.extension.aiQuickLaunch");
        logger.info("Opening workspace info panel");
    });

    // Register command to show logs
    const showLogsCommand = vscode.commands.registerCommand("ai-quick-launch.showLogs", () => {
        logger.show();
    });

    // Register command to refresh
    const refreshCommand = vscode.commands.registerCommand("ai-quick-launch.refresh", () => {
        workspaceInfoProvider?.refresh();
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(openWorkspaceInfoCommand);
    context.subscriptions.push(showLogsCommand);
	context.subscriptions.push(refreshCommand);

	logger.info("AI Quick Launch extension activation complete");
}

// This method is called when your extension is deactivated
export function deactivate() {
    logger.info("AI Quick Launch extension is being deactivated");
    if (workspaceInfoProvider) {
        workspaceInfoProvider.dispose();
    }
    logger.dispose();
}
