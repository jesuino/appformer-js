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

import * as ReactDOM from "react-dom";
import { EditorEnvelopeController } from "./EditorEnvelopeController";
import { EnvelopeBusApi } from "appformer-js-microeditor-envelope-protocol";
import { AppFormerGwtApi } from "./gwt/AppFormerGwtApi";
import { GwtEditorWrapperFactory } from "./gwt/GwtEditorWrapperFactory";
import { SpecialDomElements } from "./SpecialDomElements";
import { Renderer } from "./Renderer";
import { ReactElement } from "react";

export interface Args {
  container: HTMLElement;
  busApi: EnvelopeBusApi;
  clientSideOnly: boolean;
}

class ReactDomRenderer implements Renderer {
  public render(element: ReactElement, container: HTMLElement, callback: () => void) {
    ReactDOM.render(element, container, callback);
  }
}

export function init(args: Args) {
  const specialDomElements = new SpecialDomElements();
  const renderer = new ReactDomRenderer();
  const appFormerGwtApi = new AppFormerGwtApi();
  const editorFactory = new GwtEditorWrapperFactory(appFormerGwtApi);
  const editorEnvelopeController = new EditorEnvelopeController(
    args.busApi,
    editorFactory,
    specialDomElements,
    renderer
  );

  appFormerGwtApi.setClientSideOnly(args.clientSideOnly);
  return editorEnvelopeController.start(args.container);
}
