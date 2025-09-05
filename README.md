# AI Quick Launch

A VS Code extension for quick AI-powered launches built with TypeScript and React.

## Features

- **Workspace Info Panel**: A dedicated sidebar view that displays comprehensive information about your current workspace
- **React-based UI**: Modern, responsive interface built with React
- **Real-time Updates**: Live information about active files, workspace folders, and extensions
- **File System Watcher**: Monitor file changes in real-time with configurable patterns
- **Live Activity Feed**: See recent file creations, deletions, and modifications as they happen
- **Configurable Watch Patterns**: Add custom glob patterns to monitor specific file types or directories

## Development

This extension is set up with full debugging support and TypeScript compilation.

### Prerequisites

- VS Code 1.103.0 or higher
- Node.js and npm

### Getting Started

1. Open this project in VS Code
2. Press `F5` to launch the extension in a new Extension Development Host window
3. In the new window, you'll see a new "AI Quick Launch" icon in the activity bar (rocket icon)
4. Click the icon to open the Workspace Info panel
5. Use the "Refresh Info" button to update workspace information

### Development Workflow

- **Build**: Run `npm run compile` to build the extension
- **Watch Mode**: Run `npm run watch` for continuous compilation during development
- **Debug**: Press `F5` or use the "Run Extension" configuration in the Debug panel
- **Test**: Run `npm test` to execute the test suite

### Project Structure

- `src/extension.ts` - Main extension entry point
- `src/WorkspaceInfoProvider.ts` - Webview provider for the sidebar panel
- `webview-ui/` - React components for the webview UI
- `.vscode/launch.json` - Debug configuration
- `.vscode/tasks.json` - Build tasks
- `package.json` - Extension manifest and dependencies
- `webpack.config.js` - Webpack configuration for bundling both extension and webview

### Available Commands

- `ai-quick-launch.helloWorld` - Shows a "Hello World" message
- `ai-quick-launch.openWorkspaceInfo` - Opens the Workspace Info panel

### File Watcher Features

- **Default Patterns**: Monitors common file types (JS, TS, JSON, MD, etc.) by default
- **Custom Patterns**: Add your own glob patterns like `**/*.py`, `src/**/*.css`, etc.
- **Real-time Notifications**: See file changes instantly in the activity feed
- **Pattern Management**: Add/remove watch patterns through the UI
- **Change Types**: Tracks file creation (✅), deletion (❌), and modification (📝)
- **Workspace Events**: Monitors workspace folder changes and active editor switches

### Technical Details

- **Extension Host**: Node.js-based extension running in the main VS Code process
- **Webview**: React-based UI running in a separate webview context
- **Communication**: Message passing between extension and webview for data updates
- **Bundling**: Separate webpack configurations for extension and webview code

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
