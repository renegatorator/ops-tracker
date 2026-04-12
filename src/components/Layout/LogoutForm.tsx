"use client";

import { Button } from "@mantine/core";

interface LogoutFormProps {
  label: string;
  formAction: (formData: FormData) => void | Promise<void>;
}

const LogoutForm = ({ label, formAction }: LogoutFormProps) => (
  <form action={formAction}>
    <Button type="submit" variant="subtle" size="sm">
      {label}
    </Button>
  </form>
);

export default LogoutForm;
