"use client";

import Link from "next/link";
import { Button, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { usePathname } from "next/navigation";
import { AuthControls } from "@/components/auth/auth-controls";

const routes = [
  { href: "/analyzer", label: "Analyzer" },
  { href: "/simulator", label: "Simulator" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <Navbar isBordered maxWidth="xl">
      <NavbarBrand>
        <Link href="/" style={{ fontWeight: 700, textDecoration: "none" }}>
          Pokemon TCG Analysis
        </Link>
      </NavbarBrand>
      <NavbarContent justify="center">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <NavbarItem key={route.href}>
              <Button
                as={Link}
                href={route.href}
                variant={isActive ? "solid" : "light"}
                color={isActive ? "primary" : "default"}
              >
                {route.label}
              </Button>
            </NavbarItem>
          );
        })}
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <AuthControls />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
