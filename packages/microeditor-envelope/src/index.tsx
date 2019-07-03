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

import { AppFormerKogitoEnvelope, Args } from "./AppFormerKogitoEnvelope";
import { BusinessCentralClientEditorFactory } from "./GwtAppFormerEditor";

declare global {
  export interface AppFormer {
    KogitoEnvelope: AppFormerKogitoEnvelope;
  }
}

//Exposed API of AppFormerGwt
declare global {
  interface Window {
    gwtEditorBeans: Map<string, BusinessCentralClientEditorFactory>;
    appFormerGwtFinishedLoading: () => any;
    erraiBusApplicationRoot: string;
  }
}

export function init(args: Args) {
  return AppFormerKogitoEnvelope.init(args);
}
