import React from 'react';
import FileTypeButton from './FileTypeButton';

const DemoFileTypeButton: React.FC = () => {
  return (
    <div style={{ margin: '16px 0' }}>
      <h3>Demo: FileTypeButton</h3>
      <FileTypeButton fileType="pdf" label="Open PDF" onClick={() => alert('PDF button clicked!')} />
      <FileTypeButton fileType="js" label="Open JS" onClick={() => alert('JS button clicked!')} />
      <FileTypeButton fileType="txt" label="Open TXT" onClick={() => alert('TXT button clicked!')} />
    </div>
  );
};

export default DemoFileTypeButton;
