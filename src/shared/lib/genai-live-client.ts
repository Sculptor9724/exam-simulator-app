/* AI Voice Exam modification notice: this file has been adapted locally.
 * Retains Apache-2.0 licensing; see THIRD_PARTY_NOTICES.md for provenance.
 */
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from "@google/genai";

import { apiUrl } from "../../config/apiConfig";
import { supabase } from "../../config/supabaseClient";

import { EventEmitter } from "eventemitter3";
import { ClientContentLog, LiveClientOptions, StreamingLog } from "../../types";
import { base64ToArrayBuffer } from "./utils";

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 * Each event corresponds to a specific message from GenAI or client state change.
 */
export interface LiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when queued output audio has finished playing locally
  audiooutputcomplete: () => void;
  // Emitted when the connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation,
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
  // Emitted when the model has finished generating output for the current turn
  generationcomplete: () => void;
  // Emitted when the server reports token usage for the current session
  usage: (
    usageMetadata: NonNullable<LiveServerMessage["usageMetadata"]>,
  ) => void;
}

type LiveUsageMetadata = NonNullable<LiveServerMessage["usageMetadata"]>;

const DEFAULT_COMPRESSION_TRIGGER_RATIO = 0.8;
const MAX_CONNECTION_DURATION_MS = 30 * 60 * 1000;
const SESSION_TIMEOUT_ALERT = "Din session med AI'en timede ud";
const KNOWN_LIVE_CONTEXT_WINDOW_LIMITS: Record<string, number> = {
  "gemini-3.1-flash-live-preview": 128_000,
  "models/gemini-3.1-flash-live-preview": 128_000,
};

/**
 * A event-emitting class that manages the connection to the websocket and emits
 * events to the rest of the application.
 * If you dont want to use react you can still use this.
 */
export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  protected client: GoogleGenAI;
  private clientOptions: LiveClientOptions;
  outputMessage: string = "";
  private transcriptSpeaker: "ai" | "user" | null = null;

  private callbacks: LiveCallbacks = {
    onopen: this.onopen,
    onmessage: this.onmessage,
    onerror: this.onerror,
    onclose: this.onclose,
  };

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  private sessionResumptionHandle: string | undefined = "";
  private reconnectionAttempts: number = 0;
  private readonly maxReconnectionAttempts: number = 3;
  private manualDisconnectRequested: boolean = false;
  private previousPromptTokenCount: number | null = null;
  private connectionTimeoutId: number | null = null;

  private _session: Session | null = null;
  public get session() {
    return this._session;
  }

  private _model: string | null = null;
  public get model() {
    return this._model;
  }

  protected config: LiveConnectConfig | null = null;

  public getConfig() {
    return { ...this.config };
  }

  constructor(options: LiveClientOptions) {
    super();
    this.clientOptions = options;

    this.client = new GoogleGenAI(options);
    this.send = this.send.bind(this);
    this.onopen = this.onopen.bind(this);
    this.onerror = this.onerror.bind(this);
    this.onclose = this.onclose.bind(this);
    this.onmessage = this.onmessage.bind(this);
  }

  protected log(type: string, message: StreamingLog["message"]) {
    if (process.env.NODE_ENV !== "development") return;
    const log: StreamingLog = {
      date: new Date(),
      type,
      message,
    };

    this.emit("log", log);
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    if (this._status === "connected" || this._status === "connecting") {
      return false;
    }

    const resumptionHandle = config.sessionResumption?.handle;

    // Reset reconnection state when starting a fresh Live API session.
    if (!resumptionHandle) {
      this.reconnectionAttempts = 0;
      this.sessionResumptionHandle = "";
      this.previousPromptTokenCount = null;
    }

    this.manualDisconnectRequested = false;
    this._status = "connecting";
    this.config = config;
    this._model = model;
    this.logContextWindowCompressionConfig(model, config);
    this.logThinkingConfig(model, config);

    this.outputMessage = "";

    const callbacks: LiveCallbacks = {
      onopen: this.onopen,
      onmessage: this.onmessage,
      onerror: this.onerror,
      onclose: this.onclose,
    };

    try {
      // Get the current session from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const tokenResponse = await fetch(`${apiUrl}/auth-token`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!tokenResponse.ok) {
        throw new Error(
          `Failed to fetch ephemeral token: ${tokenResponse.statusText}`,
        );
      }
      const tokenData = await tokenResponse.json();

      this.client = new GoogleGenAI({
        httpOptions: { apiVersion: "v1alpha" },
        ...this.clientOptions,
        apiKey: tokenData.name,
      });

      this._session = await this.client.live.connect({
        model,
        config,
        callbacks,
      });
    } catch (e) {
      console.error("Error connecting to GenAI Live:", e);
      this.clearConnectionTimeout();
      this._status = "disconnected";
      return false;
    }

    this._status = "connected";
    this.startConnectionTimeout();
    return true;
  }

  public disconnect() {
    if (!this.session) {
      this.clearConnectionTimeout();
      return false;
    }
    this.manualDisconnectRequested = true;
    this.clearConnectionTimeout();
    this.session?.close();
    this._session = null;
    this._status = "disconnected";

    this.log("client.close", `Disconnected`);
    return true;
  }

  protected onopen() {
    this.log("client.open", "Connected");
    this.emit("open");
  }

  protected onerror(e: ErrorEvent) {
    this.log("server.error", e.message);
  }

  protected async onclose(e: CloseEvent) {
    // Reset status to disconnected when connection closes
    this.clearConnectionTimeout();
    this._status = "disconnected";
    this._session = null;

    if (this.manualDisconnectRequested) {
      this.manualDisconnectRequested = false;
      this.log(`server.close`, `disconnected code=${e.code}`);
      this.emit("close", e);
      return;
    }

    const shouldAttemptResume =
      e.code !== 1000 &&
      this.sessionResumptionHandle &&
      this.config &&
      this._model &&
      this.reconnectionAttempts < this.maxReconnectionAttempts;

    if (shouldAttemptResume) {
      // reconnect with resumption handle
      // BUT only once! keep a counter
      this.reconnectionAttempts++;
      this.log(
        "client.reconnect",
        `Attempting automatic reconnection with session resumption (attempt ${this.reconnectionAttempts}/${this.maxReconnectionAttempts})`,
      );

      const resumptionConfig = {
        ...this.config!,
        sessionResumption: { handle: this.sessionResumptionHandle },
      };

      // Exponential backoff before reconnect
      const backoffMs = 500 * Math.pow(2, this.reconnectionAttempts - 1);
      setTimeout(async () => {
        try {
          const reconnected = await this.connect(this._model!, resumptionConfig);
          if (!reconnected) {
            this.log(
              "client.reconnect.error",
              "Automatic reconnection did not establish a new session",
            );
            this.emit("close", e);
          }
        } catch (error) {
          console.error("Error reconnecting to GenAI Live:", error);
          this.log("client.reconnect.error", (error as Error).message);
          this.emit("close", e);
        }
      }, backoffMs);

      return;
    }

    this.log(`server.close`, `disconnected code=${e.code}`);
    this.emit("close", e);
  }

  private startConnectionTimeout() {
    this.clearConnectionTimeout();
    this.connectionTimeoutId = window.setTimeout(() => {
      this.handleConnectionTimeout();
    }, MAX_CONNECTION_DURATION_MS);
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.connectionTimeoutId);
    this.connectionTimeoutId = null;
  }

  private handleConnectionTimeout() {
    this.log("client.timeout", "Connection exceeded 30 minutes");
    this.disconnect();
    window.alert(SESSION_TIMEOUT_ALERT);
    window.location.assign("/dashboard");
  }

  protected async onmessage(message: LiveServerMessage) {
    if (message.usageMetadata) {
      this.handleUsageMetadata(message.usageMetadata);
    }

    if (message.setupComplete) {
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      this.log("server.toolCall", message);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log("server.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    if (message.sessionResumptionUpdate) {
      if (
        message.sessionResumptionUpdate.resumable &&
        message.sessionResumptionUpdate.newHandle
      ) {
        this.sessionResumptionHandle =
          message.sessionResumptionUpdate.newHandle;
        this.log("server.sessionResumptionUpdate", "Stored resumable handle");
      }
    }

    if (message.goAway) {
      this.log("server.goAway", {
        goAway: message.goAway,
        hasResumptionHandle: Boolean(this.sessionResumptionHandle),
      } as any);
    }

    // this json also might be `contentUpdate { interrupted: true }`
    // or contentUpdate { end_of_turn: true }
    if (message.serverContent) {
      const { serverContent } = message;
      if ("interrupted" in serverContent) {
        this.log("server.content", "interrupted");
        this.emit("interrupted");
        return;
      }
      // Append AI output transcription with role prefix
      if ("outputTranscription" in serverContent && serverContent.outputTranscription) {
        const ot: any = serverContent.outputTranscription as any;
        const text: string | undefined = typeof ot?.text === "string" ? ot.text : undefined;
        if (text && text.length) {
          this.appendTranscript("ai", text);
        }
      }

      // Append user input transcription with role prefix (if provided by server)
      if ("inputTranscription" in serverContent && (serverContent as any).inputTranscription) {
        const it: any = (serverContent as any).inputTranscription;
        const text: string | undefined = typeof it?.text === "string" ? it.text : undefined;
        if (text && text.length) {
          this.appendTranscript("user", text);
        }
      }

      if ("modelTurn" in serverContent) {
        const parts: Part[] = serverContent.modelTurn?.parts || [];
        if (parts.length) {
          const nonAudioParts: Part[] = [];

          parts.forEach((part) => {
            const inlineData = part.inlineData;
            if (inlineData && inlineData.mimeType?.startsWith("audio/pcm")) {
              if (inlineData.data) {
                const data = base64ToArrayBuffer(inlineData.data);
                this.emit("audio", data);
                this.log(`server.audio`, `buffer (${data.byteLength})`);
              }
              return;
            }

            nonAudioParts.push(part);
          });

          if (nonAudioParts.length) {
            const content: { modelTurn: Content } = {
              modelTurn: { parts: nonAudioParts },
            };
            this.emit("content", content);
            this.log(`server.content`, message);
          }
        }
      }

      if (serverContent.generationComplete) {
        this.log("server.content", "generationComplete");
        this.emit("generationcomplete");
      }
      if (serverContent.turnComplete) {
        this.log("server.content", "turnComplete");
        // End current line and reset speaker on turn completion for readability
        if (this.outputMessage && !this.outputMessage.endsWith("\n")) {
          this.outputMessage += "\n";
        }
        this.transcriptSpeaker = null;
        this.emit("turncomplete");
      }
    } else {
      //console.log("received unmatched message", message);
    }
  }

  private handleUsageMetadata(usageMetadata: LiveUsageMetadata) {
    const usageText = this.formatUsageMetadataText(usageMetadata);

    this.log("server.usageMetadata", usageText);
    console.log(usageText);

    const currentPromptTokenCount = usageMetadata.promptTokenCount ?? null;
    if (
      this.previousPromptTokenCount !== null &&
      currentPromptTokenCount !== null &&
      this.previousPromptTokenCount - currentPromptTokenCount > 1000 &&
      currentPromptTokenCount < this.previousPromptTokenCount * 0.75
    ) {
      const compressionText = this.formatCompressionDetectedText(
        this.previousPromptTokenCount,
        currentPromptTokenCount,
      );

      this.log("server.contextWindowCompression.likely", compressionText);
      console.log(compressionText);
    }

    this.previousPromptTokenCount = currentPromptTokenCount;
    this.emit("usage", usageMetadata);
  }

  private logContextWindowCompressionConfig(
    model: string,
    config: LiveConnectConfig,
  ) {
    const compressionConfig = (config as any).contextWindowCompression;
    if (!compressionConfig) {
      const compressionText = [
        "[LiveCompressionConfig]",
        "Compression: disabled",
        `Model: ${model}`,
      ].join("\n");

      this.log("client.contextWindowCompression.config", compressionText);
      console.log(compressionText);
      return;
    }

    const configuredTriggerTokens =
      typeof compressionConfig.triggerTokens === "number"
        ? compressionConfig.triggerTokens
        : null;
    const contextWindowLimitTokens =
      KNOWN_LIVE_CONTEXT_WINDOW_LIMITS[model] ?? null;
    const estimatedTriggerTokens =
      configuredTriggerTokens ??
      (contextWindowLimitTokens !== null
        ? Math.round(
            contextWindowLimitTokens * DEFAULT_COMPRESSION_TRIGGER_RATIO,
          )
        : null);
    const configuredTargetTokens =
      typeof compressionConfig.slidingWindow?.targetTokens === "number"
        ? compressionConfig.slidingWindow.targetTokens
        : null;

    const summary = {
      model,
      enabled: true,
      mechanism: compressionConfig.slidingWindow ? "slidingWindow" : "unknown",
      contextWindowLimitTokens,
      triggerTokens: estimatedTriggerTokens,
      triggerSource: configuredTriggerTokens
        ? "configured"
        : contextWindowLimitTokens !== null
          ? "default_80_percent_of_context_window"
          : "unknown_model_default_80_percent",
      targetTokens:
        configuredTargetTokens ??
        (estimatedTriggerTokens !== null
          ? Math.round(estimatedTriggerTokens / 2)
          : null),
      targetSource: configuredTargetTokens
        ? "configured"
        : estimatedTriggerTokens !== null
          ? "default_trigger_tokens_divided_by_2"
          : "unknown",
    };

    const compressionText = this.formatCompressionConfigText(summary);

    this.log("client.contextWindowCompression.config", compressionText);
    console.log(compressionText);
  }

  private logThinkingConfig(model: string, config: LiveConnectConfig) {
    const thinkingConfig = (config as any).thinkingConfig;
    const thinkingText = [
      "[LiveThinkingConfig]",
      `Model: ${model}`,
      `Thinking config: ${thinkingConfig ? "enabled" : "default"}`,
      `Thinking level: ${thinkingConfig?.thinkingLevel ?? "model default"}`,
      `Include thoughts: ${thinkingConfig?.includeThoughts ? "yes" : "no"}`,
      `Thinking budget: ${
        typeof thinkingConfig?.thinkingBudget === "number"
          ? this.formatTokenCount(thinkingConfig.thinkingBudget)
          : "not configured"
      }`,
    ].join("\n");

    this.log("client.thinkingConfig", thinkingText);
    console.log(thinkingText);
  }

  private formatUsageMetadataText(usageMetadata: LiveUsageMetadata) {
    const lines = [
      "[LiveUsage]",
      `Total tokens: ${this.formatTokenCount(usageMetadata.totalTokenCount)}`,
      `Prompt tokens: ${this.formatTokenCount(usageMetadata.promptTokenCount)}`,
      `Response tokens: ${this.formatTokenCount(
        usageMetadata.responseTokenCount,
      )}`,
      `Thinking tokens: ${this.formatThinkingTokenCount(usageMetadata)}`,
    ];

    lines.push(
      ...this.formatTokenDetails(
        "Prompt token details",
        usageMetadata.promptTokensDetails,
      ),
    );
    lines.push(
      ...this.formatTokenDetails(
        "Response token details",
        usageMetadata.responseTokensDetails,
      ),
    );

    return lines.join("\n");
  }

  private formatThinkingTokenCount(usageMetadata: LiveUsageMetadata) {
    return typeof usageMetadata.thoughtsTokenCount === "number"
      ? this.formatTokenCount(usageMetadata.thoughtsTokenCount)
      : "not returned by API";
  }

  private formatTokenDetails(title: string, details: unknown) {
    if (!Array.isArray(details) || !details.length) {
      return [`${title}: none reported`];
    }

    return [
      `${title}:`,
      ...details.map((detail) => {
        const item = detail as { modality?: string; tokenCount?: number };
        return `  - ${item.modality ?? "unknown"}: ${this.formatTokenCount(
          item.tokenCount,
        )} tokens`;
      }),
    ];
  }

  private formatCompressionConfigText(summary: {
    model: string;
    enabled: boolean;
    mechanism: string;
    contextWindowLimitTokens: number | null;
    triggerTokens: number | null;
    triggerSource: string;
    targetTokens: number | null;
    targetSource: string;
  }) {
    const triggerDescription =
      summary.triggerSource === "default_80_percent_of_context_window"
        ? "80% of context window"
        : summary.triggerSource === "configured"
          ? "configured"
          : "unknown; Live API default is 80% of the model context window";
    const targetDescription =
      summary.targetSource === "default_trigger_tokens_divided_by_2"
        ? "default: trigger tokens / 2"
        : summary.targetSource === "configured"
          ? "configured"
          : "unknown";

    return [
      "[LiveCompressionConfig]",
      `Compression: ${summary.enabled ? "enabled" : "disabled"}`,
      `Model: ${summary.model}`,
      `Mechanism: ${summary.mechanism}`,
      `Context window: ${this.formatTokenCount(
        summary.contextWindowLimitTokens,
      )} tokens`,
      `Compression trigger: ${this.formatTokenCount(
        summary.triggerTokens,
      )} tokens (${triggerDescription})`,
      `Target after compression: ${this.formatTokenCount(
        summary.targetTokens,
      )} tokens (${targetDescription})`,
    ].join("\n");
  }

  private formatCompressionDetectedText(
    previousPromptTokenCount: number,
    currentPromptTokenCount: number,
  ) {
    return [
      "[LiveCompression]",
      "Likely context window compression detected",
      `Prompt tokens before: ${this.formatTokenCount(
        previousPromptTokenCount,
      )}`,
      `Prompt tokens after: ${this.formatTokenCount(currentPromptTokenCount)}`,
      `Prompt token drop: ${this.formatTokenCount(
        previousPromptTokenCount - currentPromptTokenCount,
      )}`,
      `Detected at: ${new Date().toISOString()}`,
      "Reason: inferred from a sharp prompt token count drop in usageMetadata.",
    ].join("\n");
  }

  private formatTokenCount(value: number | null | undefined) {
    return typeof value === "number" ? value.toLocaleString("en-US") : "-";
  }

  private appendTranscript(role: "ai" | "user", text: string) {
    const label = role === "ai" ? "AI: " : "User: ";
    // If switching speakers, start a new line with the role label
    if (this.transcriptSpeaker !== role) {
      if (this.outputMessage && !this.outputMessage.endsWith("\n")) {
        this.outputMessage += "\n";
      }
      this.outputMessage += label;
      this.transcriptSpeaker = role;
    }
    this.outputMessage += text;
  }

  /**
   * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
   */
  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (!this.session || this._status !== "connected") {
      this.log(
        "client.realtimeInput.skipped",
        "Received realtime input but session is not connected",
      );
      return;
    }

    let hasAudio = false;
    let hasVideo = false;
    for (const ch of chunks) {
      const params: Record<string, unknown> = {};

      if (ch.mimeType.startsWith("audio")) {
        params.audio = {
          data: ch.data,
          mimeType: ch.mimeType,
        };
        hasAudio = true;
      } else if (
        ch.mimeType.startsWith("image") ||
        ch.mimeType.startsWith("video")
      ) {
        params.video = {
          data: ch.data,
          mimeType: ch.mimeType,
        };
        hasVideo = true;
      }

      if (!Object.keys(params).length) {
        this.log(
          "client.realtimeInput.skipped",
          `Unsupported realtime input mimetype: ${ch.mimeType}`,
        );
        continue;
      }

      try {
        this.session.sendRealtimeInput(params as any);
      } catch (error) {
        this.log(
          "client.realtimeInput.error",
          (error as Error).message ?? "Unknown sendRealtimeInput error",
        );
        break;
      }
      if (hasAudio && hasVideo) {
        break;
      }
    }
    const message =
      hasAudio && hasVideo
        ? "audio + video"
        : hasAudio
          ? "audio"
          : hasVideo
            ? "video"
            : "unknown";
    this.log(`client.realtimeInput`, message);
  }

  /**
   *  send a response to a function call and provide the id of the functions you are responding to
   */
  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session?.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
      this.log(`client.toolResponse`, toolResponse);
    }
  }

  /**
   * Signal that the user's audio stream has ended (e.g. microphone muted).
   * This tells the server it can stop waiting for more audio input.
   */
  sendAudioStreamEnd() {
    this.session?.sendRealtimeInput({ audioStreamEnd: true });
    this.log(`client.audioStreamEnd`, `sent`);
  }

  /**
   * send normal content parts such as { text }
   */
  send(parts: Part | Part[], turnComplete: boolean = true) {
    if (!this.session || this._status !== "connected") {
      this.log(
        "client.realtimeText.skipped",
        "Received text input but session is not connected",
      );
      return;
    }

    const normalizedParts = Array.isArray(parts) ? parts : [parts];
    const textParts = normalizedParts.filter(
      (
        part,
      ): part is Part & {
        text: string;
      } => {
        const maybeText = (part as { text?: string }).text;
        return typeof maybeText === "string" && maybeText.length > 0;
      },
    );

    if (!textParts.length) {
      this.log(
        "client.send.skipped",
        "No text parts provided for client content",
      );
      return;
    }

    const logEntry: ClientContentLog = {
      turns: textParts,
      turnComplete,
    };

    try {
      this.session!.sendClientContent({
        turns: [
          {
            role: "user",
            parts: textParts,
          },
        ],
        turnComplete,
      });
      this.log(`client.sendClientContent`, logEntry);
    } catch (error) {
      this.log(
        "client.send.error",
        (error as Error).message ?? "Unknown text send error",
      );
    }
  }
}
