export interface SpeechConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

export interface SpeechCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export class SpeechService {
  private recognition: any = null;

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  start(config: SpeechConfig, callbacks: SpeechCallbacks): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      callbacks.onError('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = config.language;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      callbacks.onResult(result[0].transcript, result.isFinal);
    };

    this.recognition.onerror = (event: any) => callbacks.onError(event.error);
    this.recognition.onend = () => callbacks.onEnd();
    this.recognition.onstart = () => callbacks.onStart();

    this.recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
  }
}
