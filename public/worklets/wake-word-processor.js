class WakeWordProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frameCount = 0;
  }
  process(inputs, outputs, parameters) {
    this.frameCount++;
    if (this.frameCount % 100 === 0) {
       this.port.postMessage({ type: 'debug', message: `Worklet alive, processed ${this.frameCount} frames, inputs length: ${inputs.length}` });
    }

    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      this.port.postMessage({ type: 'audio', data: channelData });
    }
    return true;
  }
}
registerProcessor('wake-word-processor', WakeWordProcessor);
