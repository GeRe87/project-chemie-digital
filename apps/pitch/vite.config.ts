import { defineConfig } from "vite";

// The shared static builder can publish a bounded public asset tree for a
// selected presentation family without changing the ordinary course build.
export default defineConfig({ publicDir: process.env.PCD_STATIC_PUBLIC_DIR || "public" });
