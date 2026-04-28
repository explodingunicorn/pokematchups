"use client";

import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useAuth } from "@/components/providers/auth-provider";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Card>
        <CardBody>Checking your session...</CardBody>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <h3>Sign in required</h3>
        </CardHeader>
        <CardBody>Please sign in with Google to access this page.</CardBody>
      </Card>
    );
  }

  return <>{children}</>;
}
