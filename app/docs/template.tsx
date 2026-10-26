"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

// Each docs navigation settles in with a short lift and unblur.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", duration: 0.5, bounce: 0 }}
    >
      {children}
    </motion.div>
  )
}
