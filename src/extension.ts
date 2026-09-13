import * as vscode from 'vscode';

import { ExtensionController } from './controller/extension-controller.js';

let controller: ExtensionController | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  controller = new ExtensionController();
  await controller.activate(context);
}

export async function deactivate(): Promise<void> {
  await controller?.deactivate();
  controller = undefined;
}
