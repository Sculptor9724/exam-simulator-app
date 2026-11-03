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

import cn from "classnames";

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../../../shared/contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../../../shared/hooks/use-media-stream-mux";
import { useScreenCapture } from "../../../../shared/hooks/use-screen-capture";
import { useWebcam } from "../../../../shared/hooks/use-webcam";
import { AudioRecorder } from "../../../../shared/lib/audio-recorder";
import AudioPulse from "../../../../shared/components/AudioPulse";
import "./control-tray.scss";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onStartExam?: () => void;
  onFinishExam?: () => void;
  disabled?: boolean;
  startDisabledReason?: string;
  isFinishing?: boolean;
  isStarting?: boolean;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <button
        className=" transition duration-200 ease-in-out focus:outline-none rounded bg-white border border-gray-300 text-gray-800 shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center"
        onClick={stop}
      >
        <span className="material-symbols-outlined">{onIcon}</span>
      </button>
    ) : (
      <button
        className=" transition duration-200 ease-in-out focus:outline-none rounded bg-white border border-gray-300 text-gray-800 shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center"
        onClick={start}
      >
        <span className="material-symbols-outlined">{offIcon}</span>
      </button>
    ),
);

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  onStartExam,
  onFinishExam,
  supportsVideo,
  disabled = false,
  startDisabledReason,
  isFinishing = false,
  isStarting = false,
  muted: mutedProp,
  onMutedChange,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [localMuted, setLocalMuted] = useState(false);
  const muted = mutedProp ?? localMuted;
  const setMuted = onMutedChange ?? setLocalMuted;
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const lastSentImageDataRef = useRef<string | null>(null);

  const { client, connected, volume } = useLiveAPIContext();

  useEffect(() => {
    if (!connected) {
      // When the client disconnects, stop all video streams.
      changeStreams()();
    }
  }, [connected]);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`,
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=24000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    lastSentImageDataRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;

      // Calculate dimensions with max width of 1024px while maintaining aspect ratio.
      const maxWidth = 1024;
      let targetWidth = video.videoWidth;
      let targetHeight = video.videoHeight;

      if (targetWidth > maxWidth) {
        const aspectRatio = targetHeight / targetWidth;
        targetWidth = maxWidth;
        targetHeight = maxWidth * aspectRatio;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        const hasImageChanged = data !== lastSentImageDataRef.current
      
        if (hasImageChanged) {
          console.log("Image changed");
          
          client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
          lastSentImageDataRef.current = data;
        } else {
          console.log("Image the same");
        }
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 3000);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  return (
    <section className="control-tray flex flex-col items-center">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <div className="connection-button-container flex justify-center">
        <button
          ref={connectButtonRef}
          disabled={disabled || isFinishing || isStarting}
          title={
            !connected && disabled && startDisabledReason
              ? startDisabledReason
              : undefined
          }
          className={cn(
            "transition duration-200 ease-in-out focus:outline-none rounded border text-white shadow-sm mb-6 py-5 px-8",
            disabled || isFinishing || isStarting
              ? "bg-gray-400 cursor-not-allowed opacity-50"
              : cn(
                  "hover:shadow-lg cursor-pointer",
                  connected ? "bg-[#ff4600]" : "bg-blue-500",
                ),
          )}
          onClick={async () => {
            if (!disabled && !isFinishing && !isStarting) {
              if (connected) {
                // Exam is running, finish it
                onFinishExam?.();
              } else {
                // Start the exam
                onStartExam?.();
              }
            }
          }}
        >
          {isFinishing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Eksamen bliver afsluttet
            </div>
          ) : isStarting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Starter eksamen...
            </div>
          ) : connected ? (
            "Afslut eksamen tidligt"
          ) : (
            "Start eksamen"
          )}
        </button>
      </div>

      <nav
        className={cn("actions-nav flex justify-between w-36", {
          disabled: !connected,
        })}
      >
        <button
          className={cn(
            "action-button mic-button transition duration-200 ease-in-out focus:outline-none rounded bg-white border border-gray-300 text-gray-800 shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center",
          )}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
          <div className="action-button no-action p-2 flex items-center text-gray-800">
            <AudioPulse volume={volume} active={connected} hover={false} />
          </div>
        </button>

        {supportsVideo && (
          <>
            <MediaStreamButton
              isStreaming={screenCapture.isStreaming}
              start={changeStreams(screenCapture)}
              stop={changeStreams()}
              onIcon="cancel_presentation"
              offIcon="present_to_all"
            />
          </>
        )}
        {children}
      </nav>
    </section>
  );
}

export default memo(ControlTray);
