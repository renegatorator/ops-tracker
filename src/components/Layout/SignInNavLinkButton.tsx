"use client";

import { Button } from "@mantine/core";

import { Link, usePathname } from "@/i18n/navigation";
import { routes } from "@/lib/routes";

interface SignInNavLinkButtonProps {
  label: string;
}

const SignInNavLinkButton = ({ label }: SignInNavLinkButtonProps) => {
  const pathname = usePathname();
  if (pathname === routes.login) {
    return null;
  }

  return (
    <Button component={Link} href={routes.login} variant="subtle" size="sm">
      {label}
    </Button>
  );
};

export default SignInNavLinkButton;
