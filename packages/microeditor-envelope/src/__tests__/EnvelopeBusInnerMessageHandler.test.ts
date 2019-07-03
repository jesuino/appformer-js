import { EnvelopeBusInnerMessageHandler } from "../EnvelopeBusInnerMessageHandler";
import { EnvelopeBusMessageType } from "appformer-js-microeditor-envelope-protocol";
import { LanguageData } from "appformer-js-microeditor-router";

let handler: EnvelopeBusInnerMessageHandler;
let receivedMessages: any[];
let sentMessages: any[];

beforeEach(() => {
  receivedMessages = [];
  sentMessages = [];

  handler = new EnvelopeBusInnerMessageHandler(
    {
      postMessage: (message, targetOrigin) => sentMessages.push([message, targetOrigin])
    },
    self => ({
      receive_setContentResponse: (content: string) => {
        receivedMessages.push(["setContentResponse", content]);
      },
      receive_languageResponse: (languageData: LanguageData) => {
        receivedMessages.push(["languageResponse", languageData]);
      },
      receive_getContentRequest: () => {
        receivedMessages.push(["getContentRequest", undefined]);
      }
    })
  );
});

afterEach(() => {
  handler.stopListening();
});

const delay = (ms: number) => {
  return new Promise(res => setTimeout(res, ms));
};

describe("new instance", () => {
  test("does nothing", () => {
    expect(sentMessages.length).toEqual(0);
    expect(receivedMessages.length).toEqual(0);

    expect(handler.capturedInitRequestYet).toBe(false);
    expect(handler.targetOrigin).toBe(undefined);
  });
});

describe("event listening", () => {
  test("activates when requested", async () => {
    spyOn(handler, "receive");
    handler.startListening();

    await incomingMessage("a-message");
    expect(handler.receive).toHaveBeenCalledTimes(1);
  });

  test("deactivates when requested", async () => {
    spyOn(handler, "receive");
    handler.startListening();
    handler.stopListening();

    await incomingMessage("a-message");
    expect(handler.receive).toHaveBeenCalledTimes(0);
  });

  test("activation is idempotent", async () => {
    spyOn(handler, "receive");
    handler.startListening();
    handler.startListening();

    await incomingMessage("a-message");
    expect(handler.receive).toHaveBeenCalledTimes(1);
  });

  test("deactivation is idempotent", async () => {
    spyOn(handler, "receive");
    handler.startListening();
    handler.stopListening();
    handler.stopListening();

    await incomingMessage("a-message");
    expect(handler.receive).toHaveBeenCalledTimes(0);
  });

  test("deactivation does not fail when not started", async () => {
    spyOn(handler, "receive");
    handler.stopListening();

    await incomingMessage("a-message");
    expect(handler.receive).toHaveBeenCalledTimes(0);
  });
});

describe("receive", () => {
  test("initRequest", async () => {
    handler.startListening();
    await incomingMessage({ type: EnvelopeBusMessageType.REQUEST_INIT, data: "tgt-orgn" });

    expect(handler.capturedInitRequestYet).toBe(true);
    expect(handler.targetOrigin).toBe("tgt-orgn");
    expect(sentMessages).toEqual([
      [{ type: EnvelopeBusMessageType.RETURN_INIT, data: undefined }, "tgt-orgn"],
      [{ type: EnvelopeBusMessageType.REQUEST_LANGUAGE, data: undefined }, "tgt-orgn"]
    ]);
  });

  test("languageResponse", async () => {
    handler.startListening();
    const languageData = { editorId: "", gwtModuleName: "", erraiDomain: "", resources: [] };
    await incomingMessage({ type: EnvelopeBusMessageType.RETURN_LANGUAGE, data: languageData });

    expect(receivedMessages).toEqual([["languageResponse", languageData]]);
  });

  test("setContentResponse", async () => {
    handler.startListening();
    await incomingMessage({ type: EnvelopeBusMessageType.RETURN_SET_CONTENT, data: "foo" });

    expect(receivedMessages).toEqual([["setContentResponse", "foo"]]);
  });

  test("getContentRequest", async () => {
    handler.startListening();
    await incomingMessage({ type: EnvelopeBusMessageType.REQUEST_GET_CONTENT, data: undefined });

    expect(receivedMessages).toEqual([["getContentRequest", undefined]]);
  });
});

describe("send without being initialized", () => {
  test("throws error", () => {
    expect(() => handler.send({ data: "anything", type: EnvelopeBusMessageType.RETURN_INIT })).toThrow();
  });
});

describe("send", () => {
  beforeEach(async () => {
    handler.startListening();
    await incomingMessage({ type: EnvelopeBusMessageType.REQUEST_INIT, data: "tgt-orgn" });
    sentMessages = [];
    receivedMessages = [];
  });

  test("request languageResponse", () => {
    handler.request_languageResponse();
    expect(sentMessages).toEqual([[{ type: EnvelopeBusMessageType.REQUEST_LANGUAGE, data: undefined }, "tgt-orgn"]]);
  });

  test("request setContentResponse", () => {
    handler.request_setContentResponse();
    expect(sentMessages).toEqual([[{ type: EnvelopeBusMessageType.REQUEST_SET_CONTENT, data: undefined }, "tgt-orgn"]]);
  });

  test("respond initRequest", () => {
    handler.respond_initRequest();
    expect(sentMessages).toEqual([[{ type: EnvelopeBusMessageType.RETURN_INIT, data: undefined }, "tgt-orgn"]]);
  });

  test("respond getContentRequest", () => {
    handler.respond_getContentRequest("some");
    expect(sentMessages).toEqual([[{ type: EnvelopeBusMessageType.RETURN_GET_CONTENT, data: "some" }, "tgt-orgn"]]);
  });
});

async function incomingMessage(message: any) {
  window.postMessage(message, window.location.origin);
  await delay(0); //waits til next event loop iteration
}
