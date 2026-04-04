import "../globals.scss";
import "@mantine/core/styles.css";

import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.root" });

  return {
    metadataBase: new URL(env("NEXT_PUBLIC_SITE_URL")),
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
  };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
