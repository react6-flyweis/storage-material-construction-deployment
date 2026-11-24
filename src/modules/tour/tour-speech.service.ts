export type SpeechState = "idle" | "speaking" | "finished" | "muted";

export class TourSpeechService {
  private static instance: TourSpeechService;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private state: SpeechState = "idle";
  private listeners: Set<(state: SpeechState) => void> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isUnlocked = false;
  private preferAudioFallback = false;

  private constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      if (this.synth) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
        try {
          this.synth.addEventListener?.("voiceschanged", () => {
            this.loadVoices();
          });
        } catch {
          // Ignore
        }
      }

      // Auto-unlock audio on first user interaction with the page
      const unlock = () => {
        this.prime();
        window.removeEventListener("pointerdown", unlock, true);
        window.removeEventListener("keydown", unlock, true);
      };
      window.addEventListener("pointerdown", unlock, {
        capture: true,
        once: true,
      });
      window.addEventListener("keydown", unlock, {
        capture: true,
        once: true,
      });
    }
  }

  public static getInstance(): TourSpeechService {
    if (!TourSpeechService.instance) {
      TourSpeechService.instance = new TourSpeechService();
    }
    return TourSpeechService.instance;
  }

  private loadVoices(): void {
    if (!this.synth) return;
    try {
      const v = this.synth.getVoices();
      if (v && v.length > 0) {
        this.voices = v;
        this.selectedVoice = this.pickBestVoice(this.voices);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Prime and unlock browser SpeechSynthesis / Audio within a user gesture.
   */
  public prime(): void {
    try {
      if (this.synth) {
        if (this.synth.paused) {
          this.synth.resume();
        }

        if (!this.isUnlocked) {
          const silent = new SpeechSynthesisUtterance(" ");
          silent.volume = 0.01;
          silent.rate = 2.0;
          this.synth.speak(silent);
          this.isUnlocked = true;
        }
      }
    } catch {
      // Ignore
    }
  }

  public getState(): SpeechState {
    return this.state;
  }

  public subscribe(listener: (state: SpeechState) => void): () => void {
    return this.onStateChange(listener);
  }

  public onStateChange(listener: (state: SpeechState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(state: SpeechState) {
    if (this.state === state) return;
    this.state = state;
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("[TourSpeech] Listener error:", err);
      }
    });
  }

  private pickBestVoice(
    voices: SpeechSynthesisVoice[],
  ): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;
    const english = voices.filter((v) => v.lang.startsWith("en"));
    const pool = english.length > 0 ? english : voices;

    // 1. Natural / Neural US English voices
    const naturalUS = pool.find(
      (v) =>
        v.lang.startsWith("en-US") &&
        (v.name.includes("Natural") || v.name.includes("Neural")) &&
        (v.name.includes("Jenny") ||
          v.name.includes("Aria") ||
          v.name.includes("Guy")),
    );
    if (naturalUS) return naturalUS;

    // 2. Any en-US Natural voice
    const anyNaturalUS = pool.find(
      (v) =>
        v.lang.startsWith("en-US") &&
        (v.name.includes("Natural") || v.name.includes("Neural")),
    );
    if (anyNaturalUS) return anyNaturalUS;

    // 3. Local US voices (David, Zira, Mark, Samantha)
    const localUS = pool.find(
      (v) =>
        v.lang.startsWith("en-US") &&
        (v.name.includes("David") ||
          v.name.includes("Zira") ||
          v.name.includes("Mark") ||
          v.name.includes("Samantha")),
    );
    if (localUS) return localUS;

    // 4. Google US English
    const googleUS = pool.find(
      (v) =>
        v.name.includes("Google US English") ||
        (v.lang.startsWith("en-US") && v.name.includes("Google")),
    );
    if (googleUS) return googleUS;

    // 5. Default voice if English
    const defaultEng = pool.find((v) => v.default && v.lang.startsWith("en"));
    if (defaultEng) return defaultEng;

    // 6. Any en-US voice
    const anyUS = pool.find((v) => v.lang.startsWith("en-US"));
    if (anyUS) return anyUS;

    // 7. Default voice in pool
    const defaultVoice = pool.find((v) => v.default);
    if (defaultVoice) return defaultVoice;

    return pool[0] ?? null;
  }

  public speak(text: string, isMuted: boolean): void {
    if (isMuted) {
      this.stop("muted");
      return;
    }

    if (!text.trim()) {
      this.stop("idle");
      return;
    }

    // Stop both engines first
    this.stop("idle");

    // If previous attempts established that Web Speech API is unlinked or non-functional,
    // directly use the reliable audio stream
    if (this.preferAudioFallback || !this.synth) {
      this.playFallbackAudio(text);
      return;
    }

    // If voices are not yet picked, attempt immediate refresh
    if (!this.selectedVoice && this.voices.length === 0) {
      this.loadVoices();
    }

    this.executeSpeak(text, this.selectedVoice);
  }

  private executeSpeak(
    text: string,
    voice: SpeechSynthesisVoice | null,
  ): void {
    if (!this.synth) {
      this.playFallbackAudio(text);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }

    let started = false;

    utterance.onstart = () => {
      started = true;
      if (this.currentUtterance === utterance) {
        this.setState("speaking");
      }
    };

    utterance.onend = () => {
      if (!started) {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
          this.preferAudioFallback = true;
          this.playFallbackAudio(text);
        }
        return;
      }

      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
        this.setState("finished");
      }
    };

    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
        this.preferAudioFallback = true;
        this.playFallbackAudio(text);
      }
    };

    this.currentUtterance = utterance;

    try {
      this.synth.resume();
      this.synth.speak(utterance);
    } catch {
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
        this.preferAudioFallback = true;
        this.playFallbackAudio(text);
      }
    }
  }

  private playFallbackAudio(text: string): void {
    this.stopAudio();

    try {
      const cleanText = text.replace(/[\n\r]+/g, " ").trim().slice(0, 200);
      const encoded = encodeURIComponent(cleanText);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encoded}`;

      const audio = new Audio(url);
      audio.volume = 1.0;
      this.currentAudio = audio;

      audio.onplay = () => {
        this.preferAudioFallback = true;
        this.setState("speaking");
      };

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.setState("finished");
        }
      };

      audio.onerror = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.setState("idle");
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.setState("idle");
          }
        });
      }
    } catch {
      this.setState("idle");
    }
  }

  private stopAudio(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // Ignore
      }
      this.currentAudio = null;
    }
  }

  public stop(reason: "idle" | "muted" = "idle"): void {
    if (this.synth) {
      if (this.synth.speaking || this.synth.pending) {
        try {
          this.synth.cancel();
        } catch {
          // Ignore
        }
      }
      this.currentUtterance = null;
    }

    this.stopAudio();
    this.setState(reason);
  }
}

export const tourSpeech = TourSpeechService.getInstance();
