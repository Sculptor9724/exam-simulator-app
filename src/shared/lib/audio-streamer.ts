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
  createWorketFromSrc,
  registeredWorklets,
} from "./audioworklet-registry";

export class AudioStreamer {
  private sampleRate: number;
  private bufferSize: number = 7680;
  // A queue of audio buffers to be played. Each buffer is a Float32Array.
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  // Indicates if the stream has finished playing, e.g., interrupted.
  private isStreamComplete: boolean = false;
  private checkInterval: number | null = null;
  private scheduledTime: number = 0;
  private initialBufferTime: number = 0.1; //0.1 // 100ms initial buffer
  // Web Audio API nodes. source => gain => destination
  public gainNode: GainNode;
  public source: AudioBufferSourceNode;
  private workletOutputGainNode: GainNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;
  private outputMuted: boolean = false;

  public onComplete = () => {};

  constructor(public context: AudioContext) {
    this.sampleRate = context.sampleRate;
    this.gainNode = this.context.createGain();
    this.workletOutputGainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.workletOutputGainNode.gain.value = 0;
    this.workletOutputGainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  muteOutput() {
    this.outputMuted = true;
    this.gainNode.gain.value = 0;
  }

  unmuteOutput() {
    this.outputMuted = false;
    this.gainNode.gain.value = 1;
  }

  async addWorklet<T extends (d: any) => void>(
    workletName: string,
    workletSrc: string,
    handler: T
  ): Promise<this> {
    let workletsRecord = registeredWorklets.get(this.context);
    if (workletsRecord && workletsRecord[workletName]) {
      // the worklet already exists on this context
      // add the new handler to it
      workletsRecord[workletName].handlers.push(handler);
      return Promise.resolve(this);
      //throw new Error(`Worklet ${workletName} already exists on context`);
    }

    if (!workletsRecord) {
      registeredWorklets.set(this.context, {});
      workletsRecord = registeredWorklets.get(this.context)!;
    }

    // create new record to fill in as becomes available
    workletsRecord[workletName] = { handlers: [handler] };

    const src = createWorketFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    const worklet = new AudioWorkletNode(this.context, workletName);

    //add the node into the map
    workletsRecord[workletName].node = worklet;

    return this;
  }

  /**
   * Converts a Uint8Array of PCM16 audio data into a Float32Array.
   * PCM16 is a common raw audio format, but the Web Audio API generally
   * expects audio data as Float32Arrays with samples normalized between -1.0 and 1.0.
   * This function handles that conversion.
   * @param chunk The Uint8Array containing PCM16 audio data.
   * @returns A Float32Array representing the converted audio data.
   */
  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);

    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;
      } catch (e) {
        console.error(e);
      }
    }
    return float32Array;
  }

  addPCM16(chunk: Uint8Array) {
    if (chunk.byteLength === 0) {
      return;
    }

    // Reset the stream complete flag when a new chunk is added.
    this.isStreamComplete = false;
    // Process the chunk into a Float32Array
    let processingBuffer = this._processPCM16Chunk(chunk);

    if (processingBuffer.length === 0) {
      return;
    }

    // Add the processed buffer to the queue if it's larger than the buffer size.
    // This is to ensure that the buffer is not too large.
    while (processingBuffer.length >= this.bufferSize) {
      const buffer = processingBuffer.slice(0, this.bufferSize);
      this.audioQueue.push(buffer);
      processingBuffer = processingBuffer.slice(this.bufferSize);
    }
    // Add the remaining buffer to the queue if it's not empty.
    if (processingBuffer.length > 0) {
      this.audioQueue.push(processingBuffer);
    }
    // Start playing if not already playing.
    if (!this.isPlaying) {
      this.isPlaying = true;
      // Initialize scheduledTime only when we start playing
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    }
  }

  private createAudioBuffer(audioData: Float32Array): AudioBuffer | null {
    // GenAI API sends 24kHz audio, but our context might be 48kHz
    // We need to create the buffer at the context's sample rate
    const expectedSampleRate = 24000; // GenAI API always sends 24kHz

    if (audioData.length === 0) {
      return null;
    }

    if (this.sampleRate === expectedSampleRate) {
      // No resampling needed
      const audioBuffer = this.context.createBuffer(
        1,
        audioData.length,
        this.sampleRate
      );
      audioBuffer.getChannelData(0).set(audioData);
      return audioBuffer;
    } else {
      // Upsample from 24kHz to context sample rate
      const upsampleRatio = this.sampleRate / expectedSampleRate;
      const outputLength = Math.floor(audioData.length * upsampleRatio);

      if (outputLength <= 0) {
        return null;
      }

      const audioBuffer = this.context.createBuffer(
        1,
        outputLength,
        this.sampleRate
      );

      const outputData = audioBuffer.getChannelData(0);

      // Simple linear interpolation upsampling
      for (let i = 0; i < outputLength; i++) {
        const inputIndex = i / upsampleRatio;
        const inputIndexFloor = Math.floor(inputIndex);
        const inputIndexCeil = Math.min(
          inputIndexFloor + 1,
          audioData.length - 1
        );
        const fraction = inputIndex - inputIndexFloor;

        const sample1 = audioData[inputIndexFloor] || 0;
        const sample2 = audioData[inputIndexCeil] || 0;

        outputData[i] = sample1 + (sample2 - sample1) * fraction;
      }

      return audioBuffer;
    }
  }

  private scheduleNextBuffer() {
    const SCHEDULE_AHEAD_TIME = 0.2;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      if (!audioBuffer) {
        continue;
      }

      const source = this.context.createBufferSource();

      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) {
          this.endOfQueueAudioSource.onended = null;
        }
        this.endOfQueueAudioSource = source;
        source.onended = () => {
          if (
            !this.audioQueue.length &&
            this.endOfQueueAudioSource === source
          ) {
            this.endOfQueueAudioSource = null;
            this.onComplete();
          }
        };
      }

      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const worklets = registeredWorklets.get(this.context);

      if (worklets) {
        Object.entries(worklets).forEach(([workletName, graph]) => {
          const { node, handlers } = graph;
          if (node) {
            source.connect(node);
            node.port.onmessage = function (ev: MessageEvent) {
              handlers.forEach((handler) => {
                handler.call(node.port, ev);
              });
            };
            node.connect(this.workletOutputGainNode);
          }
        });
      }
      // Ensure we never schedule in the past
      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(startTime);
      this.scheduledTime = startTime + audioBuffer.duration;
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      } else {
        if (!this.checkInterval) {
          this.checkInterval = window.setInterval(() => {
            if (this.audioQueue.length > 0) {
              this.scheduleNextBuffer();
            }
          }, 100) as unknown as number;
        }
      }
    } else {
      const nextCheckTime =
        (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(
        () => this.scheduleNextBuffer(),
        Math.max(0, nextCheckTime - 50)
      );
    }
  }

  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + 0.1
    );

    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = this.outputMuted ? 0 : 1;
      this.gainNode.connect(this.context.destination);
    }, 200);
  }

  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(
      this.outputMuted ? 0 : 1,
      this.context.currentTime,
    );
  }

  complete() {
    this.isStreamComplete = true;
    this.onComplete();
  }
}

// // Usage example:
// const audioStreamer = new AudioStreamer();
//
// // In your streaming code:
// function handleChunk(chunk: Uint8Array) {
//   audioStreamer.handleChunk(chunk);
// }
//
// // To start playing (call this in response to a user interaction)
// await audioStreamer.resume();
//
// // To stop playing
// // audioStreamer.stop();
