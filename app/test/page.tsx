"use client";

import { motion } from "motion/react";

export default function TestPage() {
  return (
    <div style={{ background: "#0a0a0a", color: "white", minHeight: "100vh", padding: "40px" }}>
      <h1 style={{ marginBottom: "20px" }}>Motion Test</h1>

      {/* Test 1: motion initial/animate */}
      <motion.div
        style={{ padding: "20px", background: "#222", borderRadius: "8px", marginBottom: "16px" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        TEST 1: motion initial/animate (should fade in)
      </motion.div>

      {/* Test 2: motion with filter blur */}
      <motion.div
        style={{ padding: "20px", background: "#222", borderRadius: "8px", marginBottom: "16px" }}
        initial={{ opacity: 0, filter: "blur(20px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        TEST 2: motion with filter blur (should unblur)
      </motion.div>

      {/* Test 3: plain div, no motion */}
      <div style={{ padding: "20px", background: "#222", borderRadius: "8px", marginBottom: "16px" }}>
        TEST 3: plain div (always visible)
      </div>

      {/* Test 4: motion with only opacity */}
      <motion.div
        style={{ padding: "20px", background: "#222", borderRadius: "8px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        TEST 4: motion opacity only (should fade in)
      </motion.div>
    </div>
  );
}
