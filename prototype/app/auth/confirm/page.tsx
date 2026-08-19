import type { Metadata } from "next";
import { Suspense } from "react";
import ConfirmInviteForm from "./confirm-form";

export const metadata: Metadata = {
  title: "Confirm invite",
};

export default function ConfirmInvitePage() {
  return (
    <Suspense fallback={null}>
      <ConfirmInviteForm />
    </Suspense>
  );
}
