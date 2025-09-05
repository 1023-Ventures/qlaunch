# Terminal Opening Examples

## Usage in QuickLaunchList Component

### Modifier Key Actions
- **Normal Click**: Opens file with OS default application
- **Cmd/Ctrl + Click**: Opens file in VS Code  
- **Alt + Click**: Opens containing folder in file manager
- **Shift + Click**: Opens new VS Code terminal at file location

### Direct Terminal Opening

You can also open a terminal directly at any folder path:

```typescript
// Open terminal at specific folder
openTerminalAt('/path/to/project/folder');

// Or send message directly
window.vscode.postMessage({
    type: 'openTerminalAt',
    folderPath: '/path/to/project/folder'
});
```

### Backend Implementation

The extension handles terminal opening in two ways:

1. **Via openWithOS**: When `openMethod` is set to `'vscode-terminal'`
2. **Direct terminal**: Using the `openTerminalAt` message type

Both methods create a new VS Code terminal with:
- **Name**: `Terminal - {folder name}`
- **Working Directory**: The specified folder path
- **Auto-show**: Terminal automatically becomes visible

### Example Use Cases

- Open terminal at workspace root
- Open terminal at specific project subdirectory  
- Open terminal at file location for quick access
- Multiple terminals for different project areas
