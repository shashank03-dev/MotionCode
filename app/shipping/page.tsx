import type { Metadata } from "next";
import { LegalPage, SiteFooter, SiteHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Shipping & Delivery - MotionCode",
  description:
    "How access to MotionCode is delivered. MotionCode is a digital service with no physical shipping.",
};

const sections = [
  {
    title: "Digital service",
    body: [
      "MotionCode is a software-as-a-service product delivered entirely online. There are no physical goods, and nothing is shipped to a postal address.",
    ],
  },
  {
    title: "Delivery of access",
    body: [
      "Access to paid features is delivered electronically and activated on your account immediately after a successful payment is confirmed.",
      "If your plan does not upgrade within a few minutes of a successful payment, contact us and we will resolve it.",
    ],
  },
  {
    title: "Service availability",
    body: [
      "The service is accessible at https://motioncode.live from any supported web browser once you are signed in.",
    ],
  },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <SiteHeader />
      <LegalPage
        title="Shipping & Delivery"
        updated="June 29, 2026"
        intro="MotionCode is a digital service. This page explains how access is delivered."
        sections={sections}
      />
      <SiteFooter />
    </div>
  );
}
