import type { Metadata } from "next";
import SettingsForm from "./settings-form";

export const metadata: Metadata = {
  title: "Company Settings",
};

export default function SettingsPage() {
  return <SettingsForm />;
}