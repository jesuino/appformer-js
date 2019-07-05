import { AppFormerGwtApi } from "./AppFormerGwtApi";
import { LanguageData } from "appformer-js-microeditor-router/src";
import * as AppFormer from "appformer-js-core";
import { GwtEditorWrapper } from "./GwtEditorWrapper";
import { EditorFactory } from "../EditorFactory";
import { Resource } from "appformer-js-microeditor-router";

export class GwtEditorWrapperFactory implements EditorFactory {
  private readonly appFormerGwtApi: AppFormerGwtApi;

  constructor(appFormerGwtApi: AppFormerGwtApi) {
    this.appFormerGwtApi = appFormerGwtApi;
  }

  public createEditor(languageData: LanguageData) {
    return new Promise<AppFormer.Editor>(res => {
      this.appFormerGwtApi.setErraiDomain(languageData.erraiDomain); //needed only for backend communication

      this.appFormerGwtApi.onFinishedLoading(() => {
        res(new GwtEditorWrapper(this.appFormerGwtApi.getEditor(languageData.editorId)));
        return Promise.resolve();
      });

      languageData.resources.forEach(resource => {
        this.loadResource(resource);
      });
    });
  }
  private loadResource(resource: Resource) {
    resource.paths.forEach(path => {
      switch (resource.type) {
        case "css":
          const link = document.createElement("link");
          link.href = path;
          link.rel = "text/css";
          document.body.appendChild(link);
          break;
        case "js":
          const script = document.createElement("script");
          script.src = path;
          script.type = "text/javascript";
          document.body.appendChild(script);
          break;
      }
    });
  }
}
