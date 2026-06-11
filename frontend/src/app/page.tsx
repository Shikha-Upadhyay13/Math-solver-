import Link from "next/link";
import { ArrowRight, Camera, Keyboard, Mic, Sparkles, BookOpen, Check } from "lucide-react";
import { MathRender } from "@/components/MathRender";
import { APP_NAME } from "@/lib/config";

const features = [
  {
    icon: Keyboard,
    title: "Type it",
    desc: "Algebra, calculus, matrices — type any expression with natural syntax like 2x^2 + 3x = 5.",
  },
  {
    icon: Camera,
    title: "Snap it",
    desc: "Upload a photo of a textbook problem or handwritten equation. Our OCR turns it into solvable math.",
  },
  {
    icon: Mic,
    title: "Speak it",
    desc: "Say \"derivative of x squared plus three x\" — we'll transcribe and solve.",
  },
  {
    icon: Sparkles,
    title: "Step-by-step",
    desc: "Don't just get the answer. Get a clear, line-by-line walkthrough so you actually learn.",
  },
  {
    icon: BookOpen,
    title: "Wide coverage",
    desc: "From basic arithmetic to differential equations, linear algebra, statistics, and beyond.",
  },
];

const samples = [
  { label: "Differentiate", expr: "\\frac{d}{dx}\\left[x^3 + \\sin(x)\\right]" },
  { label: "Integrate", expr: "\\int \\frac{1}{1 + x^2}\\,dx" },
  { label: "Solve", expr: "2x^2 + 3x - 5 = 0" },
  { label: "Limit", expr: "\\lim_{x \\to 0} \\frac{\\sin x}{x}" },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-muted)] mb-8">
          <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
          Type, snap, or speak — solve any math problem
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-indigo-200 bg-clip-text text-transparent leading-tight">
          The math platform
          <br /> built to teach you.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--color-muted)]">
          {APP_NAME} solves algebra, calculus, linear algebra, statistics — and
          shows you every step so you understand <em>why</em> the answer works.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-medium transition-colors shadow-lg shadow-indigo-500/30"
          >
            Start solving free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/solve"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--color-border)] hover:bg-white/5 font-medium transition-colors"
          >
            Try the solver
          </Link>
        </div>

        {/* Sample expressions strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
          {samples.map((s) => (
            <div
              key={s.label}
              className="px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 backdrop-blur"
            >
              <div className="text-xs text-[var(--color-muted)] mb-1">
                {s.label}
              </div>
              <MathRender expr={s.expr} />
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Three ways in. One clear answer out.
          </h2>
          <p className="mt-4 text-[var(--color-muted)]">
            However the problem reaches you — typed, photographed, or spoken —
            you get a verified answer and a walkthrough you can actually follow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 hover:bg-[var(--color-surface)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What you can solve */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)] p-8 sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            From homework to research.
          </h2>
          <p className="text-[var(--color-muted)] max-w-2xl">
            Coverage that scales with you, from middle-school algebra to grad-level
            differential equations.
          </p>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            {[
              "Arithmetic & order of operations",
              "Algebra & equation solving",
              "Polynomial factoring & expansion",
              "Trigonometry & identities",
              "Differentiation",
              "Integration (definite & indefinite)",
              "Limits",
              "Matrices: det, inv, eigenvalues",
              "Systems of equations",
              "Statistics & probability",
              "Geometry",
              "Word problems (AI-assisted)",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[var(--color-fg)]/90"
              >
                <Check className="w-4 h-4 mt-0.5 text-[var(--color-success)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Ready when you are.
        </h2>
        <p className="mt-4 text-[var(--color-muted)]">
          Free to sign up. No credit card. Solve your first problem in 30 seconds.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 font-medium transition-colors shadow-lg shadow-indigo-500/30"
        >
          Create your account
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
