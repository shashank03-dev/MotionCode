import type { Metadata } from "next";
import { LegalPage, SiteFooter, SiteHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Cancellation & Refunds - MotionCode",
  description:
    "How MotionCode subscription cancellations and refunds are handled.",
};

const sections = [
  {
    title: "Subscriptions",
    body: [
      "MotionCode Pro and Studio are billed as recurring monthly subscriptions in Indian Rupees (INR) through Razorpay.",
      "Your subscription renews automatically at the end of each billing cycle until you cancel it.",
    ],
  },
  {
    title: "Cancelling your subscription",
    body: [
      "You can cancel at any time from Billing settings inside your account. No cancellation fee applies.",
      "When you cancel, your plan stays active until the end of the current billing cycle, and you are not charged again. After the cycle ends, your account moves to the free plan.",
    ],
  },
  {
    title: "Refunds",
    body: [
      "Because access is delivered immediately and billing is monthly, payments for a billing cycle that has already started are generally non-refundable.",
      "If you were charged in error, charged after cancelling, or could not access the service due to a fault on our side, contact us within 7 days of the charge and we will review and, where appropriate, issue a full or prorated refund.",
      "Approved refunds are returned to the original payment method via Razorpay, typically within 5–7 business days.",
    ],
  },
  {
    title: "How to request a refund",
    body: [
      "Email motioncode.auth@gmail.com from the address on your account with your payment ID and the reason for the request. We respond to refund requests within 3 business days.",
    ],
  },
];

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <SiteHeader />
      <LegalPage
        title="Cancellation & Refunds"
        updated="June 29, 2026"
        intro="This policy explains how subscription cancellations and refunds work for MotionCode."
        sections={sections}
      />
      <SiteFooter />
    </div>
  );
}
