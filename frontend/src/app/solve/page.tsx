"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  Camera,
  Keyboard,
  Lightbulb,
  Loader2,
  Mic,
  Square,
  Upload,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";
import { MathRender } from "@/components/MathRender";
import { normalizeMathSpeech } from "@/lib/speech";

type Mode = "text" | "image" | "voice";

interface SolveResult {
  operation?: string;
  method?: string;
  steps?: Array<string | { step: string; explanation: string }>;
  final_answer?: unknown;
  variables?: string[];
  error?: string;
  details?: string;
  hint?: string;
}

const EXAMPLES = [
  "diff(x^3 + sin(x))",
  "integrate(1/(1+x^2))",
  "limit(sin(x)/x, x, 0)",
  "2x^2 + 3x - 5 = 0",
  "factor(x^2 - 1)",
  "det([[1,2],[3,4]])",
];

export default function SolvePage() {
  const [mode, setMode] = useState<Mode>("text");

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Solve a problem
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Type the expression, upload a photo, or speak it.
        </p>
      </header>

      <div className="inline-flex p-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] mb-6">
        <ModeTab current={mode} value="text" label="Text" icon={Keyboard} onClick={setMode} />
        <ModeTab current={mode} value="image" label="Image" icon={Camera} onClick={setMode} />
        <ModeTab current={mode} value="voice" label="Voice" icon={Mic} onClick={setMode} />
      </div>

      {mode === "text" && <TextMode />}
      {mode === "image" && <ImageMode />}
      {mode === "voice" && <VoiceMode />}
    </div>
  );
}

function ModeTab({
  current,
  value,
  label,
  icon: Icon,
  onClick,
}: {
  current: Mode;
  value: Mode;
  label: string;
  icon: typeof Keyboard;
  onClick: (v: Mode) => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
        active
          ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
          : "text-[var(--color-muted)] hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function TextMode() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<SolveResult | null>(null);
  const [loading, setLoading] = useState<"solve" | "explain" | null>(null);

  async function run(endpoint: "solve" | "explain") {
    if (!question.trim()) return;
    setLoading(endpoint);
    setResult(null);
    try {
      const data = await api.post<SolveResult>(
        endpoint === "solve" ? "/solve" : "/explain",
        { text: question },
        { auth: false },
      );
      setResult(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unknown error";
      setResult({ error: message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="e.g. integrate(x^2 + 3x)"
          className="w-full bg-transparent text-lg font-mono focus:outline-none resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              run("solve");
            }
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2 pt-3 border-t border-[var(--color-border)]">
          <div className="text-xs text-[var(--color-muted)]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10">Ctrl</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10">Enter</kbd> to solve
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => run("explain")}
              disabled={!!loading || !question.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-white/5 text-sm disabled:opacity-50"
            >
              {loading === "explain" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              Explain
            </button>
            <button
              onClick={() => run("solve")}
              disabled={!!loading || !question.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-sm font-medium disabled:opacity-50"
            >
              {loading === "solve" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              Solve
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
          Examples
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setQuestion(ex)}
              className="px-3 py-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] text-xs font-mono transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {result && <ResultPanel result={result} />}
    </div>
  );
}

interface OCRMeta {
  provider: string;
  confidence: number;
  latex: string | null;
  fallback_reason: string | null;
}

function ImageMode() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<string | null>(null);
  const [meta, setMeta] = useState<OCRMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onExtract() {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setExtracted(null);
    setMeta(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = getToken();
      const res = await fetch(`${API_URL}/image-ocr`, {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (await res.json()) as {
        success: boolean;
        text?: string;
        latex?: string | null;
        confidence?: number;
        provider?: string;
        fallback_reason?: string | null;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error ?? data.message ?? "Failed to extract math from image");
        return;
      }
      setExtracted(data.text ?? "");
      setMeta({
        provider: data.provider ?? "unknown",
        confidence: data.confidence ?? 0,
        latex: data.latex ?? null,
        fallback_reason: data.fallback_reason ?? null,
      });
    } catch {
      setError("Cannot reach the backend.");
    } finally {
      setExtracting(false);
    }
  }

  async function onSolve() {
    if (!extracted) return;
    setSolving(true);
    setResult(null);
    try {
      const data = await api.post<SolveResult>(
        "/solve",
        { text: extracted },
        { auth: false },
      );
      setResult(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unknown error";
      setResult({ error: message });
    } finally {
      setSolving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <label className="block w-full">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              setExtracted(null);
              setError(null);
              setResult(null);
            }}
          />
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-colors">
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="upload preview"
                  className="max-h-60 rounded-md"
                />
                <div className="text-sm text-[var(--color-muted)]">
                  {file?.name} · click to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-[var(--color-muted)]">
                <Upload className="w-8 h-8" />
                <div>
                  <div className="font-medium text-white">
                    Click to upload an image
                  </div>
                  <div className="text-sm">PNG, JPG, or WebP up to 8 MB</div>
                </div>
              </div>
            )}
          </div>
        </label>

        {file && (
          <button
            onClick={onExtract}
            disabled={extracting}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-medium transition-colors disabled:opacity-50"
          >
            {extracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {extracting ? "Extracting…" : "Extract math from image"}
          </button>
        )}

        {error && (
          <div className="mt-4 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {extracted !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                Extracted (edit if needed)
              </div>
              {meta && <OCRMetaBadges meta={meta} />}
            </div>

            {meta?.latex && (
              <div className="mb-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]/60 px-4 py-3 overflow-x-auto">
                <div className="text-xs text-[var(--color-muted)] mb-1">
                  Recognised
                </div>
                <MathRender expr={meta.latex} display />
              </div>
            )}

            <textarea
              value={extracted}
              onChange={(e) => setExtracted(e.target.value)}
              rows={2}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 font-mono focus:outline-none focus:border-indigo-500"
            />

            {meta?.fallback_reason && (
              <div className="mt-2 text-xs text-amber-300/90 flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Low confidence ({Math.round(meta.confidence * 100)}%). Double-check
                the extracted text before solving.
              </div>
            )}

            <button
              onClick={onSolve}
              disabled={solving || !extracted}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-white/5 font-medium transition-colors disabled:opacity-50"
            >
              {solving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              Solve
            </button>
          </div>
        )}
      </div>

      {result && <ResultPanel result={result} />}
    </div>
  );
}

function OCRMetaBadges({ meta }: { meta: OCRMeta }) {
  const pct = Math.round(meta.confidence * 100);
  const dotColor =
    meta.confidence >= 0.8
      ? "bg-emerald-400"
      : meta.confidence >= 0.6
        ? "bg-amber-400"
        : "bg-rose-400";
  const providerLabel =
    meta.provider === "mathpix"
      ? "via Mathpix"
      : meta.provider === "pix2text"
        ? "via Pix2Text"
        : `via ${meta.provider}`;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-[var(--color-border)] text-[var(--color-muted)]">
        {providerLabel}
      </span>
      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-[var(--color-border)] inline-flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {pct}% confidence
      </span>
    </div>
  );
}

function VoiceMode() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<SolveResult | null>(null);
  const [solving, setSolving] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      // @ts-expect-error vendor prefix
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: { resultIndex: number; results: { 0: { transcript: string } }[] }) => {
      let t = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        t += event.results[i][0].transcript;
      }
      setTranscript(normalizeMathSpeech(t));
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => rec.stop();
  }, []);

  function toggle() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      setTranscript("");
      setResult(null);
      rec.start();
      setListening(true);
    }
  }

  async function solve() {
    if (!transcript.trim()) return;
    setSolving(true);
    setResult(null);
    try {
      const data = await api.post<SolveResult>(
        "/solve",
        { text: transcript },
        { auth: false },
      );
      setResult(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unknown error";
      setResult({ error: message });
    } finally {
      setSolving(false);
    }
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-muted)]">
        Your browser doesn&apos;t support speech recognition. Try Chrome, Edge, or
        Safari.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <button
          onClick={toggle}
          className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            listening
              ? "bg-gradient-to-br from-rose-500 to-red-500 shadow-lg shadow-rose-500/40 animate-pulse"
              : "bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/30"
          }`}
        >
          {listening ? (
            <Square className="w-9 h-9 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>
        <div className="mt-4 text-sm text-[var(--color-muted)]">
          {listening
            ? "Listening… speak your problem"
            : "Tap the mic and say your math problem"}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={2}
          placeholder="Your speech will appear here…"
          className="mt-6 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 font-mono text-left focus:outline-none focus:border-indigo-500"
        />

        <button
          onClick={solve}
          disabled={solving || !transcript.trim()}
          className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-medium transition-colors disabled:opacity-50"
        >
          {solving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          Solve
        </button>
      </div>

      {result && <ResultPanel result={result} />}
    </div>
  );
}

function ResultPanel({ result }: { result: SolveResult }) {
  if (result.error) {
    return (
      <div className="rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-5">
        <div className="text-sm font-semibold text-[var(--color-danger)]">
          {result.error}
        </div>
        {result.hint && (
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            {result.hint}
          </div>
        )}
        {result.details && (
          <div className="mt-2 text-xs font-mono text-[var(--color-muted)] break-all">
            {result.details}
          </div>
        )}
      </div>
    );
  }

  const steps = result.steps ?? [];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {result.operation ?? "Result"}
        </div>
        {result.method && (
          <div className="text-xs text-[var(--color-muted)]">{result.method}</div>
        )}
      </div>

      <div className="p-5">
        {steps.length > 0 && (
          <ol className="space-y-3 mb-5">
            {steps.map((s, i) => {
              const isObj = typeof s === "object";
              return (
                <li key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {isObj ? s.step : (s as string)}
                    </div>
                    {isObj && s.explanation && (
                      <div className="text-sm text-[var(--color-muted)] mt-0.5">
                        {s.explanation}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-4">
          <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
            Final answer
          </div>
          <div className="text-xl">
            <FormatAnswer value={result.final_answer} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormatAnswer({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-[var(--color-muted)]">—</span>;
  }
  if (typeof value === "string") {
    return <MathRender expr={pythonToLatex(value)} />;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((v, i) => (
          <li key={i}>
            <FormatAnswer value={v} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <pre className="text-sm font-mono whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function pythonToLatex(s: string): string {
  return s
    .replace(/\*\*/g, "^")
    .replace(/\*/g, " \\cdot ")
    .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/pi\b/g, "\\pi")
    .replace(/oo/g, "\\infty");
}
