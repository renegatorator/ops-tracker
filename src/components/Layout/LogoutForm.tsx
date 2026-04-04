"use client";

import { Button } from "@mantine/core";

type Props = {
  label: string;
  formAction: (formData: FormData) => void | Promise<void>;
};

export function LogoutForm({ label, formAction }: Props) {
  return (
    <form action={formAction}>
      <Button type="submit" variant="subtle" size="sm">
        {label}
      </Button>
    </form>
  );
}
