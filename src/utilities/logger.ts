import * as vscode from 'vscode';

class Logger {
    private static _instance: Logger;
    private _outputChannel: vscode.OutputChannel;

    private constructor() {
        this._outputChannel = vscode.window.createOutputChannel('AI Quick Launch');
    }

    public static getInstance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    public info(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const fullMessage = args.length > 0 
            ? `[${timestamp}] INFO: ${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
            : `[${timestamp}] INFO: ${message}`;
        
        this._outputChannel.appendLine(fullMessage);
    }

    public warn(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const fullMessage = args.length > 0 
            ? `[${timestamp}] WARN: ${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
            : `[${timestamp}] WARN: ${message}`;
        
        this._outputChannel.appendLine(fullMessage);
    }

    public error(message: string, error?: Error | any, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        let fullMessage = `[${timestamp}] ERROR: ${message}`;
        
        if (error) {
            if (error instanceof Error) {
                fullMessage += ` - ${error.message}`;
                if (error.stack) {
                    fullMessage += `\nStack trace: ${error.stack}`;
                }
            } else {
                fullMessage += ` - ${typeof error === 'object' ? JSON.stringify(error) : String(error)}`;
            }
        }
        
        if (args.length > 0) {
            fullMessage += ` ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`;
        }
        
        this._outputChannel.appendLine(fullMessage);
    }

    public debug(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const fullMessage = args.length > 0 
            ? `[${timestamp}] DEBUG: ${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
            : `[${timestamp}] DEBUG: ${message}`;
        
        this._outputChannel.appendLine(fullMessage);
    }

    public show(): void {
        this._outputChannel.show();
    }

    public dispose(): void {
        this._outputChannel.dispose();
    }
}

export const logger = Logger.getInstance();
