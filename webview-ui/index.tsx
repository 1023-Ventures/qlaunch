import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import WorkspaceInfoPanel from './WorkspaceInfoPanel';
import DemoFileTypeButton from './DemoFileTypeButton';


const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
	<>
		<DemoFileTypeButton />
		<WorkspaceInfoPanel />
	</>
);
