"use client";

import { Nav } from "@/components/chrono/nav";

/** The marketing nav for every page that isn't the landing page. */
export function SiteHeader() {
  return <Nav variant="site" position="sticky" />;
}
