"use client";
import { signOut } from "next-auth/react";
export default function SignOutButton({ className = "b g" }) {
  return <button className={className} onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button>;
}
