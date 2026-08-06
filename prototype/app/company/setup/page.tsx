import type { Metadata } from "next";
import SetupForm from "./setup-form";

export const metadata: Metadata = {
  title: "Set up your company",
};

export default function CompanySetupPage() {
  return <SetupForm />;
}