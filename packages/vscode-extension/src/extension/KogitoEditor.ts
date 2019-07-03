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
import * as fs from "fs";
import { LocalRouter } from "./LocalRouter";
import { EnvelopeBusOuterMessageHandler } from "appformer-js-microeditor-envelope-protocol";
import { KogitoEditorStore } from "./KogitoEditorStore";

export class KogitoEditor {
  private readonly path: string;
  private readonly context: vscode.ExtensionContext;
  private readonly router: LocalRouter;
  private readonly panel: vscode.WebviewPanel;
  private readonly editorStore: KogitoEditorStore;
  private readonly envelopeBusOuterMessageHandler: EnvelopeBusOuterMessageHandler;

  public constructor(
    path: string,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    router: LocalRouter,
    editorStore: KogitoEditorStore
  ) {
    this.path = path;
    this.panel = panel;
    this.context = context;
    this.router = router;
    this.editorStore = editorStore;
    this.envelopeBusOuterMessageHandler = new EnvelopeBusOuterMessageHandler(
      {
        postMessage: msg => {
          this.panel.webview.postMessage(msg);
        }
      },
      self => ({
        pollInit: () => {
          self.request_initResponse("vscode");
        },
        receive_languageRequest: () => {
          const fileExtension = this.path.split(".").pop()!;
          self.respond_languageRequest(this.router.getLanguageData(fileExtension));
        },
        receive_getContentResponse: (content: string) => {
          fs.writeFileSync(this.path, content);
          vscode.window.setStatusBarMessage("Saved successfully!", 3000);
        },
        receive_setContentRequest: () => {
          self.respond_setContentRequest(fs.readFileSync(this.path).toString());
        }
      })
    );
  }

  public requestSave() {
    if (this.path.length > 0) {
      this.envelopeBusOuterMessageHandler.request_getContentResponse();
    } else {
      console.info("Save skipped because path is empty.");
    }
  }

  public setupEnvelopeBus() {
    this.context.subscriptions.push(
      this.panel.webview.onDidReceiveMessage(
        msg => this.envelopeBusOuterMessageHandler.receive(msg),
        this,
        this.context.subscriptions
      )
    );
    this.envelopeBusOuterMessageHandler.startInitPolling();
  }

  public setupPanelActiveStatusChange() {
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.active) {
          this.editorStore.setActive(this);
        }

        if (!this.panel.active && this.editorStore.isActive(this)) {
          this.editorStore.setNoneActive();
        }
      },
      this,
      this.context.subscriptions
    );
  }

  public setupWebviewContent() {
    this.panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <style>
                html, body, session, main, div#app {
                    margin: 0;
                    border: 0;
                    padding: 0;
                    overflow: hidden;
                }
                </style>
    
                <title></title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            </head>
            <body>
            <div id="microeditor-envelope-container"></div>
            <script src="${this.getWebviewIndexJsPath()}"></script>
            </body>
        </html>
    `;
  }

  private getWebviewIndexJsPath() {
    return this.router.getRelativePathTo("dist/webview/index.js").toString();
  }

  public sameAs(editor: KogitoEditor) {
    return this.path === editor.path;
  }
}
