import { Platform } from 'react-native';

type VoiceResult = {
  transcript: string;
  demo?: boolean;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getWebSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const DEMO_PHRASES = [
  'У питомца снижена активность, это повод для беспокойства?',
  'Подскажите, что делать, если температура выше обычной?',
  'Куда лучше обратиться, если питомец хромает?',
];

/**
 * Starts voice capture. Uses Web Speech API when available;
 * otherwise returns a short demo transcript after a listening pause.
 */
export function startVoiceCapture(options?: {
  lang?: string;
  timeoutMs?: number;
  onPartial?: (text: string) => void;
}): { stop: () => void; promise: Promise<VoiceResult | null> } {
  const lang = options?.lang ?? 'ru-RU';
  const timeoutMs = options?.timeoutMs ?? 6000;
  let stopped = false;
  let recognition: SpeechRecognitionLike | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      recognition?.stop();
    } catch {
      // ignore
    }
  };

  const promise = new Promise<VoiceResult | null>((resolve) => {
    const finish = (value: VoiceResult | null) => {
      if (stopped && value === null) {
        resolve(null);
        return;
      }
      stop();
      resolve(value);
    };

    const Ctor = getWebSpeechCtor();
    if (Ctor) {
      try {
        recognition = new Ctor();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = false;
        let latest = '';

        recognition.onresult = (event) => {
          const chunk = event.results?.[event.results.length - 1];
          const text = chunk?.[0]?.transcript?.trim() ?? '';
          if (text) {
            latest = text;
            options?.onPartial?.(text);
          }
          if (chunk && 'isFinal' in chunk && chunk.isFinal && text) {
            finish({ transcript: text });
          }
        };
        recognition.onerror = () => finish(latest ? { transcript: latest } : null);
        recognition.onend = () => finish(latest ? { transcript: latest } : null);
        recognition.start();

        timer = setTimeout(() => {
          if (latest) {
            finish({ transcript: latest });
          } else {
            try {
              recognition?.stop();
            } catch {
              finish(null);
            }
          }
        }, timeoutMs);
        return;
      } catch {
        // fall through to demo
      }
    }

    // Native / unsupported: simulate short listening window, then demo phrase.
    timer = setTimeout(() => {
      const phrase =
        DEMO_PHRASES[Math.floor(Math.random() * DEMO_PHRASES.length)] ??
        'У питомца снижена активность, это повод для беспокойства?';
      options?.onPartial?.(phrase);
      finish({ transcript: phrase, demo: Platform.OS !== 'web' });
    }, Math.min(2500, timeoutMs));
  });

  return { stop, promise };
}
