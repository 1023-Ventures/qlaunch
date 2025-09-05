import React from 'react';

export type FileTypeButtonProps = {
  fileType: string; // e.g. 'pdf', 'txt', 'js'
  onClick?: () => void;
  label?: string;
};

// This component expects to receive the icon URI for the file type from the extension host.
// The iconUri should be resolved in the extension and passed to the webview via message or props.
// Here, we use a convention for the icon URI: 'vscode-file-icon:{fileType}'

const FileTypeButton: React.FC<FileTypeButtonProps> = ({ fileType, onClick, label }) => {
  // VS Code webview cannot directly access the file icon, so the extension should provide the icon URI.
  // For now, we use the VS Code theme icon font as a fallback.
  // The extension can send a real icon URI via props or webview message for a richer experience.
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className={`codicon codicon-file-${fileType.toLowerCase()}`} style={{ fontSize: 20 }} />
      {label && <span>{label}</span>}
    </button>
  );
};

export default FileTypeButton;
