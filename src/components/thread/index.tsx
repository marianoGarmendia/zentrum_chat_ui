import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";

import Image from "next/image";
import { ArrowDown, LoaderCircle } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import WhatsappAhare from "../icons/whatsapp";

// import naturgy_logo from "../../../assets/naturgy_logo_text-removebg.png";
// import naturgy_logo_chat from "../../../assets/naturgy.png";
// import perfil_image from "../../../assets/agent_perfil.jpeg";
// import zentrum_logo from "../../../assets/zentrum_logo.png";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

// function OpenGitHubRepo() {
//   return (
//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <a
//             href="https://github.com/langchain-ai/agent-chat-ui"
//             target="_blank"
//             className="flex items-center justify-center"
//           >
//             <GitHubSVG
//               width="24"
//               height="24"
//             />
//           </a>
//         </TooltipTrigger>
//         <TooltipContent side="left">
//           <p>Open GitHub repo</p>
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   );
// }

export function Thread() {
  const [threadId, setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [reference, setReference] = useQueryState("reference");
  // const [hideToolCalls, setHideToolCalls] = useQueryState(
  //   "hideToolCalls",
  //   parseAsBoolean.withDefault(false),
  // );
  const [showinputField, setShowinputField] = useState(false);
  const [hideToolCalls, setHideToolCalls] = useState(true);
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const firstMessageRef = useRef(0);
  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    // console.log("hide tool calls", hideToolCalls);

    setHideToolCalls(true);
  }, [hideToolCalls, setHideToolCalls]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstMessageRef.current !== 0) return;

      const newHumanMessage: Message = {
        id: `do-not-render-${uuidv4()}`,
        type: "human",
        content: "hola",
      };

      const toolMessages = ensureToolCallsHaveResponses(stream.messages);
      stream.submit(
        { messages: [...toolMessages, newHumanMessage] },
        {
          config: { configurable: { user_id: uuidv4(), api_key: "123" } },
          streamMode: ["values"],
          optimisticValues: (prev) => ({
            ...prev,
            messages: [
              ...(prev.messages ?? []),
              ...toolMessages,
              newHumanMessage,
            ],
          }),
        },
      );
      firstMessageRef.current = 1;
      setInput("");
      setShowinputField(true);
    }, 3000); // Espera de 1 segundo

    return () => clearTimeout(timer); // Limpieza del temporizador al desmontar
  }, [firstMessageRef]);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },

      {
        config: { configurable: { user_id: 77, reference: reference } },
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r bg-white"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -300 }
              : { x: chatHistoryOpen ? 0 : -300 }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div
            className="relative h-full"
            style={{ width: 300 }}
          >
            <ThreadHistory />
          </div>
        </motion.div>
      </div>
      <motion.div
        className={cn(
          "relative flex min-w-0 flex-1 flex-col overflow-hidden",
          !chatStarted && "grid-rows-[1fr]",
        )}
        layout={isLargeScreen}
        animate={{
          marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
          width: chatHistoryOpen
            ? isLargeScreen
              ? "calc(100% - 300px)"
              : "100%"
            : "100%",
        }}
        transition={
          isLargeScreen
            ? { type: "spring", stiffness: 300, damping: 30 }
            : { duration: 0 }
        }
      >
        {!chatStarted && (
          <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between gap-3 p-2 pl-4">
            <div>
              {/* {(!chatHistoryOpen || !isLargeScreen) && (
                <Button
                  className="hover:bg-gray-100"
                  variant="ghost"
                  onClick={() => setChatHistoryOpen((p) => !p)}
                >
                  {chatHistoryOpen ? (
                    <PanelRightOpen className="size-5" />
                  ) : (
                    <PanelRightClose className="size-5" />
                  )}
                </Button>
              )} */}
            </div>
            <div className="absolute top-2 right-4 flex items-center">
              {/* <OpenGitHubRepo /> */}
            </div>
          </div>
        )}
        {chatStarted && (
          <div className="relative z-10 flex items-center justify-between gap-3 p-2">
            <div className="relative flex items-center justify-start gap-2">
              <div className="absolute left-0 z-10">
                {/* {(!chatHistoryOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-gray-100"
                    variant="ghost"
                    onClick={() => setChatHistoryOpen((p) => !p)}
                  >
                    {chatHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                )} */}
              </div>
              {/* <motion.button
                className="flex cursor-pointer items-center gap-2"
                onClick={() => setThreadId(null)}
                animate={{
                  marginLeft: !chatHistoryOpen ? 48 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              > */}
              {/* <LangGraphLogoSVG
                  width={32}
                  height={32}
                /> */}
              <span className="text-xl font-semibold tracking-tight">
                {/* <Image
                  src={zentrum_logo}
                  alt="Naturgy Logo"
                  width={200}
                  height={200}
                  className="mx-2 bg-gray-400 "
                /> */}
              </span>
              {/* </motion.button> */}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <WhatsappAhare />

                {/* <OpenGitHubRepo /> */}
              </div>
              {/* <TooltipIconButton
                size="lg"
                className="p-4"
                tooltip="New thread"
                variant="ghost"
                onClick={() => setThreadId(null)}
              >
                <SquarePen className="size-5" />
              </TooltipIconButton> */}
            </div>

            <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
          </div>
        )}

        <StickToBottom className="relative flex-1 overflow-hidden">
          <StickyToBottomContent
            className={cn(
              "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
              !chatStarted && "mt-[5vh] flex flex-col items-stretch",
              chatStarted && "grid grid-rows-[1fr_auto]",
            )}
            contentClassName="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full"
            content={
              <>
                {messages
                  .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                  .map((message, index) =>
                    message.type === "human" ? (
                      <HumanMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                      />
                    ) : (
                      <AssistantMessage
                        key={message.id || `${message.type}-${index}`}
                        message={message}
                        isLoading={isLoading}
                        handleRegenerate={handleRegenerate}
                      />
                    ),
                  )}
                {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                {hasNoAIOrToolMessages && !!stream.interrupt && (
                  <AssistantMessage
                    key="interrupt-msg"
                    message={undefined}
                    isLoading={isLoading}
                    handleRegenerate={handleRegenerate}
                  />
                )}
                {isLoading && !firstTokenReceived && (
                  <AssistantMessageLoading />
                )}
              </>
            }
            footer={
              <div className="sticky bottom-0 flex flex-col items-center gap-4 bg-white">
                {/* {!chatStarted && (
                  <div className="flex flex-col items-center gap-3">
                   
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Agent IA - FaceApp
                    </h1>
                    <p>Gestión de suministro de Gas Naturgy</p>
                  </div>
                )} */}

                <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                {!showinputField ? (
                  <div className="top-0 flex flex-col items-center gap-4 bg-white">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex flex-col items-center">
                        {/* <Image
                          src={zentrum_logo}
                          alt="Naturgy Logo"
                          width={250}
                          height={250}
                          className="mx-6 bg-gray-400"
                        /> */}
                        {/* <Image
                          src={perfil_image}
                          alt="Descripción de la imagen"
                          width={170}
                          height={170}
                          className=""
                        /> */}
                      </div>
                      <div className="flex items-center gap-2 py-2 text-center">
                        <h1 className="text-2xl font-bold text-gray-800">
                          Zen
                        </h1>
                        <p className="text-xl text-gray-700">Agente IA</p>
                      </div>

                      <div className="mx-4 mb-6 rounded-lg bg-[#004571] p-6 text-white">
                        <p className="text-md mb-2 text-center last:mb-0">
                          Especialista en autos usados en venta de Autonova
                        </p>
                      </div>
                      <p className="text-center">
                        En un momento tu Agente atenderá tu
                        solicitud{" "}
                      </p>
                      <div>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-400">
                      Powered by laCalle AI
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl border shadow-xs">
                    <form
                      onSubmit={handleSubmit}
                      className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                    >
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.metaKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            const el = e.target as HTMLElement | undefined;
                            const form = el?.closest("form");
                            form?.requestSubmit();
                          }
                        }}
                        placeholder="Escribe tu mensaje..."
                        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                      />

                      <div className="flex items-center justify-between p-2 pt-4">
                        <div>
                          <div className="flex items-center space-x-2"></div>
                        </div>
                        {stream.isLoading ? (
                          <Button
                            key="stop"
                            onClick={() => stream.stop()}
                          >
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Cancelar
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="shadow-md transition-all bg-[#e57200]"
                            disabled={isLoading || !input.trim()}
                          >
                            Enviar
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
                {chatStarted && (
                  <p className="absolute bottom-1 text-center text-xs text-gray-400">
                    Powered by laCalle AI
                  </p>
                )}
              </div>
            }
          />
        </StickToBottom>
      </motion.div>
    </div>
  );
}
