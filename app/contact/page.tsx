import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Contact Us - MotionCode",
  description: "How to reach the MotionCode team for support and billing.",
};

const sections = [
  {
    title: "Email",
    body: [
      <>
        For support, billing, and account questions, email{" "}
        <a
          href="mailto:motioncode.auth@gmail.com"
          className="inline-flex min-h-[44px] items-center text-accent underline underline-offset-4"
        >
          motioncode.auth@gmail.com
        </a>
        . We aim to respond within 1–2 business days.
      </>,
    ],
  },
  {
    title: "Support",
    body: [
      "Signed-in users can also reach us from the in-app Support page at https://motioncode.live/support, which lets you send a message tied to your account.",
    ],
  },
  {
    title: "Billing",
    body: [
      "For subscription, cancellation, or refund requests, include your payment ID and the email on your account so we can locate the transaction quickly.",
    ],
  },
];

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact Us"
      updated="June 29, 2026"
      intro="Reach the MotionCode team for support, billing, and account help."
      sections={sections}
    />
  );
}
