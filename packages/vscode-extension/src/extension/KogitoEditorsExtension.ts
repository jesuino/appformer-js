/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from "vscode";
import { KogitoEditor } from "./KogitoEditor";

export class KogitoEditorsExtension {
  private readonly context: vscode.ExtensionContext;
  private activeKogitoEditor?: KogitoEditor;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public registerCustomSaveCommand() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand("workbench.action.files.save", () => {
        // If a kogito editor is active, its content is saved manually.
        if (this.activeKogitoEditor) {
          this.activeKogitoEditor.requestSave();
        }

        // If a text editor is active, we save it normally.
        if (vscode.window.activeTextEditor) {
          vscode.window.activeTextEditor.document.save();
        }

        return Promise.resolve();
      })
    );
  }

  public subscribeToActiveTextEditorChanges() {
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((textEditor?: vscode.TextEditor) => {
        if (!textEditor) {
          return;
        }

        if (this.supportsLanguage(textEditor.document.languageId)) {
          this.replaceDefaultEditorByKogitoEditor(textEditor);
        }
      })
    );
  }

  private replaceDefaultEditorByKogitoEditor(textEditor: vscode.TextEditor) {
    vscode.commands.executeCommand("workbench.action.closeActiveEditor").then(() => {
      this.activeKogitoEditor = this.newKogitoEditor(textEditor.document.uri.path);
      return Promise.resolve();
    });
  }

  private newKogitoEditor(path: string) {
    const kogitoEditor = new KogitoEditor(path);
    kogitoEditor.open();
    kogitoEditor.setupMessageBus(this.context);
    kogitoEditor.setupPanelViewStateChanged(this.context, isPanelActive => {
      if (isPanelActive) {
        this.activeKogitoEditor = kogitoEditor;
      } else if (this.activeKogitoEditor && this.activeKogitoEditor.path === kogitoEditor.path) {
        this.activeKogitoEditor = undefined;
      }
    });
    kogitoEditor.setupWebviewContent(this.context);
    return kogitoEditor;
  }

  private supportsLanguage(languageId: string) {
    const extension = vscode.extensions.getExtension("kiegroup.appformer-js-vscode-extension");
    if (!extension) {
      throw new Error("Extension configuration not found.");
    }

    const matchingLanguages = (extension.packageJSON.contributes.languages as any[]).filter(
      language => language.extensions.indexOf("." + languageId) > -1
    );

    return matchingLanguages.length > 0;
  }
}
