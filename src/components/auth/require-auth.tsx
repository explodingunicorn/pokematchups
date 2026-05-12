"use client";

import type { ReactNode } from "react";
import { Card } from "@heroui/react";
import { useAuth } from "@/components/providers/auth-provider";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Card>
        <Card.Content>Checking your session...</Card.Content>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <Card.Header>
          <h3>Sign in required</h3>
        </Card.Header>
        <Card.Content>Please sign in with Google to access this page.</Card.Content>
      </Card>
    );
  }

  return <>{children}</>;
}
