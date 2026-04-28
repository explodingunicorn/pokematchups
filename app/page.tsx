import Link from "next/link";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";

export default function HomePage() {
  return (
    <Card>
      <CardHeader>
        <h1>Pokemon TCG Analysis Tools</h1>
      </CardHeader>
      <CardBody style={{ display: "grid", gap: 12 }}>
        <p>
          This migration moves the app to Next.js SSR, HeroUI components, and a
          Supabase-backed auth/data foundation.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Button as={Link} href="/analyzer" color="primary">
            Open Analyzer
          </Button>
          <Button as={Link} href="/simulator" variant="bordered">
            Open Simulator
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
