import type { Metadata } from "next";
import { LegalPage, SiteFooter, SiteHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Privacy - MotionCode",
  description:
    "Privacy notes for the MotionCode product surface and animation analysis workflow.",
};

const sections = [
  {
    title: "Information processed",
    body: [
      "MotionCode may process the animation clip you choose, sampled frames derived from that clip, prompts needed to request analysis, generated output, browser metadata, and operational logs.",
      "Do not upload confidential, sensitive, or personal media unless the deployment you are using has been configured and reviewed for that use.",
    ],
  },
  {
    title: "How information is used",
    body: [
      "Submitted motion references are used to generate the requested motion spec and starter snippets.",
      "Operational data may be used to debug failures, prevent abuse, and understand whether the product is functioning as expected.",
    ],
  },
  {
    title: "Service providers",
    body: [
      "A deployment may rely on hosting, database, analytics, payment, or AI providers configured by the operator of that deployment.",
      "The public product surface should not be read as a guarantee that every optional provider is enabled.",
    ],
  },
  {
    title: "Retention",
    body: [
      "Retention depends on deployment configuration and the data path used for a specific request.",
      "If you operate this project, document your retention choices before accepting sensitive production data.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Use the support route for what to include when asking about privacy, data handling, or a failed request.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <SiteHeader />
      <LegalPage
        title="Privacy"
        updated="June 6, 2026"
        intro="These notes describe the public MotionCode product surface in this repository. A production deployment should publish deployment-specific privacy details."
        sections={sections}
      />
      <SiteFooter />
    </div>
  );
}
