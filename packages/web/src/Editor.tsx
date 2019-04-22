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

import * as React from "react";
import { useEffect, useState } from "react";
import { match } from "react-router";
import { getFileContentService, setFileContentService } from "./service/Service";
import { router, services } from "appformer-js-microeditor-router";
import { AppFormerBusMessage } from "appformer-js-submarine";
import { Breadcrumb, BreadcrumbItem, Button, PageSection, PageSectionVariants } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import { routes } from "./Routes";

export function Editor(props: { match: match<{ space: string; project: string; filePath: string }> }) {
  const decodedFilePath = decodeURIComponent(props.match.params.filePath.replace(/\+/g, "%20"));
  const fileExtension = decodedFilePath.split(".").pop()!;
  const languageData = router.get(fileExtension);
  if (!languageData) {
    //FIXME: Fallback to default text editor like Ace.js.
    return <div>{"Oops, no enhanced editor was found for extension " + fileExtension}</div>;
  }

  let iframe: HTMLIFrameElement;
  //FIXME: This URLs will probably be kogito.redhat.com/appformer-js/router or something like that.
  const iframeDomain = services.microeditor_envelope;
  const iframeSrc = services.microeditor_envelope;

  useEffect(() => {
    const initPolling = setInterval(() => {
      const initMessage = { type: "REQUEST_INIT", data: window.location.origin };
      if (iframe && iframe.contentWindow) {
        const contentWindow = iframe.contentWindow;
        contentWindow.postMessage(initMessage, iframeDomain);
      }
    }, 1000);

    const handler = (event: MessageEvent) => {
      const message = event.data as AppFormerBusMessage<any>;
      switch (message.type) {
        case "RETURN_INIT":
          clearInterval(initPolling);
          break;
        case "REQUEST_LANGUAGE":
          const returnLanguageMessage = { type: "RETURN_LANGUAGE", data: languageData };
          iframe.contentWindow!.postMessage(returnLanguageMessage, iframeDomain);
          break;
        case "REQUEST_SET_CONTENT":
          getFileContentService(props.match.params.space, props.match.params.project, decodedFilePath)
            .then(res => res.text())
            .then(content => {
              const setContentReturnMessage = { type: "RETURN_SET_CONTENT", data: content.trim() };
              iframe.contentWindow!.postMessage(setContentReturnMessage, iframeDomain);
            });
          break;
        case "RETURN_GET_CONTENT":
          setFileContentService(
            props.match.params.space,
            props.match.params.project,
            decodedFilePath,
            message.data
          ).then(v => {
            setEphemeralStatus("Saved.");
          });
          break;
        default:
          console.debug("Unknown message type " + message.type);
          break;
      }
    };

    window.addEventListener("message", handler, false);
    return () => {
      window.removeEventListener("message", handler, false);
    };
  }, []);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusBarOpen, setStatusBarOpen] = useState(false);

  const setEphemeralStatus = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const save = () => {
    iframe.contentWindow!.postMessage({ type: "REQUEST_GET_CONTENT", data: undefined }, iframeDomain);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={routes.spaces()}>Spaces</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={routes.space({ space: props.match.params.space })}>{props.match.params.space}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={routes.project({ space: props.match.params.space, project: props.match.params.project })}>
              {props.match.params.project}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive={true}>
            <Link
              to={routes.file({
                space: props.match.params.space,
                project: props.match.params.project,
                filePath: props.match.params.filePath
              })}
            >
              {decodedFilePath}
            </Link>
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      {/*FIXME: Stop using this padding: 0 */}
      <PageSection style={{ padding: "0" }}>
        <iframe
          style={{ borderTop: "1px solid lightgray", width: "100%", height: "100%" }}
          ref={i => (iframe = iframe ? iframe : i!)}
          src={iframeSrc}
        />
        {statusBarOpen && (
          <div
            onClick={() => setStatusBarOpen(false)}
            style={{
              color: "white",
              padding: "10px",
              backgroundColor: "#363636",
              width: "100vw",
              zIndex: 999,
              bottom: 0,
              left: 0,
              position: "fixed",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>{statusMessage}</div>
            <Button
              variant={"primary"}
              type={"button"}
              onClick={(e: any) => {
                e.stopPropagation();
                save();
              }}
            >
              Save
            </Button>
          </div>
        )}
        {!statusBarOpen && (
          <div
            onClick={() => {
              setStatusBarOpen(true);
              setEphemeralStatus("Click the status bar do hide it.");
            }}
            style={{
              color: "white",
              backgroundColor: "#363636",
              width: "100px",
              borderRadius: "5px 5px 0 0 ",
              zIndex: 999,
              bottom: "0",
              paddingTop: "4px",
              left: "50%",
              marginLeft: "-50px",
              textAlign: "center",
              position: "fixed"
            }}
          >
            ^
          </div>
        )}
      </PageSection>
    </>
  );
}
