"use client";

import { Button, Chip } from "@heroui/react";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthControls() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <Chip variant="flat">Loading auth...</Chip>;
  }

  if (!user) {
    return (
      <Button color="primary" onPress={() => void signInWithGoogle()}>
        Sign in with Google
      </Button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Chip variant="flat">{user.email}</Chip>
      <Button variant="bordered" onPress={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
