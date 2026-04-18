"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Context ────────────────────────────────────────────────────────────────
interface AccordionCtx {
  openItems: string[]
  toggle:    (value: string) => void
  type:      "single" | "multiple"
}
const AccordionContext = React.createContext<AccordionCtx>({
  openItems: [],
  toggle:    () => {},
  type:      "single",
})

const ItemContext = React.createContext<string>("")

// ── Accordion (root) ───────────────────────────────────────────────────────
interface AccordionProps {
  type?:         "single" | "multiple"
  defaultValue?: string
  children:      React.ReactNode
  className?:    string
}

function Accordion({
  type = "single",
  defaultValue,
  children,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(
    defaultValue ? [defaultValue] : []
  )

  const toggle = React.useCallback(
    (value: string) => {
      if (type === "single") {
        setOpenItems((prev) => (prev.includes(value) ? [] : [value]))
      } else {
        setOpenItems((prev) =>
          prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value]
        )
      }
    },
    [type]
  )

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

// ── AccordionItem ──────────────────────────────────────────────────────────
interface AccordionItemProps {
  value:     string
  children:  React.ReactNode
  className?: string
}

function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <ItemContext.Provider value={value}>
      <div className={cn("border-b", className)}>{children}</div>
    </ItemContext.Provider>
  )
}

// ── AccordionTrigger ───────────────────────────────────────────────────────
function AccordionTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { openItems, toggle } = React.useContext(AccordionContext)
  const value  = React.useContext(ItemContext)
  const isOpen = openItems.includes(value)

  return (
    <button
      type="button"
      data-state={isOpen ? "open" : "closed"}
      onClick={() => toggle(value)}
      className={cn(
        "flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-all",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
}

// ── AccordionContent ───────────────────────────────────────────────────────
interface AccordionContentProps {
  children:   React.ReactNode
  className?: string
}

function AccordionContent({ children, className }: AccordionContentProps) {
  const { openItems } = React.useContext(AccordionContext)
  const value  = React.useContext(ItemContext)
  const isOpen = openItems.includes(value)

  if (!isOpen) return null

  return (
    <div className={cn("pb-4 pt-0 text-sm", className)}>
      {children}
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }