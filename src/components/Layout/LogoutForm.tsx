"use client";

import { Button } from "@mantine/core";

interface LogoutFormProps {
  label: string;
  formAction: (formData: FormData) => void | Promise<void>;
}

export function LogoutForm({ label, formAction }: LogoutFormProps) {
  return (
    <form action={formAction}>
      <Button type="submit" variant="subtle" size="sm">
        {label}
      </Button>
    </form>
  );
}
