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

const AudioRecordingWorklet = `
class AudioProcessingWorklet extends AudioWorkletProcessor {

  // Target sample rate for GenAI Live API
  targetSampleRate = 24000;
  
  // send and clear buffer every 2048 samples at 24kHz
  buffer = new Int16Array(2048);

  // current write index
  bufferWriteIndex = 0;
  
  // For resampling
  resampleRatio = 1;
  inputBuffer = [];
  inputSampleIndex = 0;

  constructor() {
    super();
    this.hasAudio = false;
  }

  /**
   * @param inputs Float32Array[][] [input#][channel#][sample#] so to access first inputs 1st channel inputs[0][0]
   * @param outputs Float32Array[][]
   */
  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      
      // Calculate resample ratio on first process call
      if (this.resampleRatio === 1 && sampleRate !== this.targetSampleRate) {
        this.resampleRatio = sampleRate / this.targetSampleRate;
        //console.log(\`📊 Resampling from \${sampleRate}Hz to \${this.targetSampleRate}Hz (ratio: \${this.resampleRatio})\`);
      }
      
      this.processChunk(channel0);
    }
    return true;
  }

  sendAndClearBuffer(){
    this.port.postMessage({
      event: "chunk",
      data: {
        int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
      },
    });
    this.bufferWriteIndex = 0;
  }

  processChunk(float32Array) {
    if (this.resampleRatio === 1) {
      // No resampling needed
      const l = float32Array.length;
      for (let i = 0; i < l; i++) {
        const int16Value = float32Array[i] * 32768;
        this.buffer[this.bufferWriteIndex++] = int16Value;
        if(this.bufferWriteIndex >= this.buffer.length) {
          this.sendAndClearBuffer();
        }
      }
    } else {
      // Resample to 24kHz using simple decimation
      this.inputBuffer.push(...float32Array);
      
      while (this.inputBuffer.length >= this.resampleRatio) {
        // Take every Nth sample based on resample ratio
        const sampleIndex = Math.floor(this.inputSampleIndex);
        if (sampleIndex < this.inputBuffer.length) {
          const sample = this.inputBuffer[sampleIndex];
          const int16Value = sample * 32768;
          this.buffer[this.bufferWriteIndex++] = int16Value;
          
          if(this.bufferWriteIndex >= this.buffer.length) {
            this.sendAndClearBuffer();
          }
        }
        
        this.inputSampleIndex += this.resampleRatio;
        
        // Clean up processed input samples
        if (this.inputSampleIndex >= this.inputBuffer.length) {
          this.inputBuffer = [];
          this.inputSampleIndex = 0;
        }
      }
    }

    if(this.bufferWriteIndex >= this.buffer.length) {
      this.sendAndClearBuffer();
    }
  }
}
`;

export default AudioRecordingWorklet;
