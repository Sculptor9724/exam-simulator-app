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

import { useState, useEffect } from "react";
import { UseMediaStreamResult } from "./use-media-stream-mux";

function stopMediaStream(mediaStream: MediaStream) {
  mediaStream.getTracks().forEach((track) => track.stop());
}

export function useWebcam(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const handleStreamEnded = () => {
      setIsStreaming(false);
      setStream(null);
    };
    if (stream) {
      stream
        .getTracks()
        .forEach((track) => track.addEventListener("ended", handleStreamEnded));
      return () => {
        stream
          .getTracks()
          .forEach((track) =>
            track.removeEventListener("ended", handleStreamEnded),
          );
        stopMediaStream(stream);
      };
    }
  }, [stream]);

  const start = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    setStream(mediaStream);
    setIsStreaming(true);
    return mediaStream;
  };

  const stop = () => {
    if (stream) {
      stopMediaStream(stream);
      setStream(null);
      setIsStreaming(false);
    }
  };

  const result: UseMediaStreamResult = {
    type: "webcam",
    start,
    stop,
    isStreaming,
    stream,
  };

  return result;
}
