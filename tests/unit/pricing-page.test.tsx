import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import PricingPage from "@/app/pricing/page";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("pricing page Razorpay checkout", () => {
  it("renders Razorpay checkout CTAs for paid plans", () => {
    const renderedHtml = renderToStaticMarkup(<PricingPage />);

    expect(renderedHtml).toContain("₹0");
    expect(renderedHtml).toContain("₹100");
    expect(renderedHtml).toContain("₹500");
    expect(renderedHtml).toContain("Pay with Razorpay");
    expect(renderedHtml).not.toContain("signup queue");
  });
});
