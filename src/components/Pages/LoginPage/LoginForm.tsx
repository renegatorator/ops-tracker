"use client";

import {
  Alert,
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import Script from "next/script";
import { useRef, useState } from "react";

import type { LoginError } from "./LoginPage";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

interface LoginFormProps {
  action: (formData: FormData) => Promise<void>;
  error?: LoginError;
  siteKey: string | undefined;
  labels: {
    emailLabel: string;
    emailPlaceholder: string;
    emailTitle: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    errorInvalidCredentials: string;
    errorGeneric: string;
  };
}

const LoginForm = ({ action, error, siteKey, labels }: LoginFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (siteKey && window.grecaptcha) {
        await new Promise<void>((resolve) => {
          window.grecaptcha!.ready(resolve);
        });
        const token = await window.grecaptcha.execute(siteKey, {
          action: "login",
        });
        if (tokenInputRef.current) {
          tokenInputRef.current.value = token;
        }
      }
    } catch {
      // If token fetch fails, submit anyway — server will handle missing token
    }

    const formData = new FormData(formRef.current!);
    await action(formData);
    setIsSubmitting(false);
  };

  return (
    <>
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="lazyOnload"
        />
      )}

      <form ref={formRef} onSubmit={handleSubmit}>
        <Stack gap="md">
          {error ? (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error === "invalid_credentials"
                ? labels.errorInvalidCredentials
                : labels.errorGeneric}
            </Alert>
          ) : null}

          <input
            ref={tokenInputRef}
            type="hidden"
            name="recaptcha_token"
            defaultValue=""
          />

          <TextInput
            type="email"
            name="email"
            label={labels.emailLabel}
            placeholder={labels.emailPlaceholder}
            pattern=".+@.+"
            title={labels.emailTitle}
            required
          />
          <PasswordInput
            name="password"
            label={labels.passwordLabel}
            placeholder={labels.passwordPlaceholder}
            required
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            {labels.submit}
          </Button>

          {siteKey && (
            <Text size="xs" c="dimmed" ta="center">
              Protected by reCAPTCHA —{" "}
              <Anchor
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
              >
                Privacy
              </Anchor>{" "}
              &amp;{" "}
              <Anchor
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
              >
                Terms
              </Anchor>
            </Text>
          )}
        </Stack>
      </form>
    </>
  );
};

export default LoginForm;
