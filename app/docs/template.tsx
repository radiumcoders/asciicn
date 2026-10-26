"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

// Each docs navigation settles in with a short lift and unblur. The filter is dropped
// afterwards so it never becomes the containing block for fixed elements.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      transition={{ type: "spring", duration: 0.5, bounce: 0 }}
    >
      {children}
    </motion.div>
  )
}
