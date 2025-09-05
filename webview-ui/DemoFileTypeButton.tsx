import React from 'react';
import FileTypeButton from './FileTypeButton';

const DemoFileTypeButton: React.FC = () => {
  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-3 text-vscode-foreground">Demo: FileTypeButton</h3>
      <div className="space-y-2">
        <FileTypeButton fileType="pdf" label="Open PDF" onClick={() => alert('PDF button clicked!')} />
        <FileTypeButton fileType="js" label="Open JS" onClick={() => alert('JS button clicked!')} />
        <FileTypeButton fileType="txt" label="Open TXT" onClick={() => alert('TXT button clicked!')} />
      </div>
    </div>
  );
};

export default DemoFileTypeButton;
