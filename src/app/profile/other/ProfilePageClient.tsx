"use client";
import ProfilePage from "../page";

interface ProfilePageClientProps {
  address: string;
}

export default function ProfilePageClient({ address }: ProfilePageClientProps) {
  return <ProfilePage params={{ address }} />;
}
