"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Upload, Cpu, BarChart3 } from "lucide-react"

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload your document",
    description:
      "Drop any PDF — research papers, reports, policies, product docs. It's processed for both pipelines simultaneously.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Ask your question",
    description:
      "Type a natural language query. Vectorless and Vectored RAG run in parallel and return independent answers.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Get a data-driven verdict",
    description:
      "An LLM judge scores both answers on five dimensions and runs a hallucination scan — then declares a winner.",
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="py-20 md:py-28" ref={ref}>
      <div className="mx-auto max-w-6xl px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight">How it works</h2>
          <p className="text-muted-foreground">
            Three steps to know exactly which RAG pipeline serves your data best.
          </p>
        </motion.div>

        {/* Icon row with animated connectors — desktop only */}
        <div className="mb-8 hidden items-center md:flex">
          {STEPS.map((step, i) => (
            <div key={step.step} className="flex flex-1 items-center">
              {/* Icon bubble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.18, ease: "easeOut" }}
                className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10"
              >
                <step.icon className="h-5 w-5 text-violet-400" />
                {/* Step number badge */}
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 font-mono text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </motion.div>

              {/* Animated connector line */}
              {i < STEPS.length - 1 && (
                <div className="relative mx-3 flex-1 overflow-hidden">
                  {/* Static dashed track */}
                  <div className="h-px w-full border-t border-dashed border-border/40" />
                  {/* Animated fill line */}
                  <motion.div
                    className="absolute inset-0 h-px origin-left bg-gradient-to-r from-violet-500 to-violet-300"
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : {}}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.18 + 0.3,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Moving dot along the line */}
                  <motion.div
                    className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-400"
                    initial={{ left: "0%", opacity: 0 }}
                    animate={isInView ? { left: "100%", opacity: [0, 1, 1, 0] } : {}}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.18 + 0.3,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step cards */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.15 + 0.2, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              {/* Mobile icon (hidden on desktop — shown above) */}
              <div className="flex items-center gap-3 md:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
                  <step.icon className="h-5 w-5 text-violet-400" />
                </div>
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {step.step}
                </span>
              </div>

              {/* Desktop step number */}
              <span className="hidden font-mono text-xs font-medium text-muted-foreground md:block">
                {step.step}
              </span>

              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}