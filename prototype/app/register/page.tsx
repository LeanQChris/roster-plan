import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Create your company",
  description:
    "Register your company and admin account on the Roster workforce scheduling platform.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}