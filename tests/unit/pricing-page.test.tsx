import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import PricingPage from "@/app/pricing/page";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("pricing page beta mode", () => {
  it("shows early-access CTAs instead of Razorpay checkout", () => {
    const renderedHtml = renderToStaticMarkup(<PricingPage />);

    expect(renderedHtml).toContain("Join early access");
    expect(renderedHtml).not.toContain("Pay with Razorpay");
  });

  it("can render Razorpay checkout only when paid checkout is explicitly enabled", () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "paid";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";

    const renderedHtml = renderToStaticMarkup(<PricingPage />);

    expect(renderedHtml).toContain("Pay with Razorpay");
    expect(renderedHtml).not.toContain("Join early access");
  });
});
