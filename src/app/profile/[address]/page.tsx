"use client";
import ProfilePage from "../page";

export default function UserProfilePage({ params }: { params: { address: string } }) {
  return <ProfilePage params={{ address: params.address }} />;
}
