import type { Metadata } from "next";
import AcceptInviteForm from "./accept-invite-form";

export const metadata: Metadata = {
  title: "Accept your invite",
};

export default function AcceptInvitePage() {
  return <AcceptInviteForm />;
}
