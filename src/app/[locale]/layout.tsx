import "../globals.scss";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import AppNotifications from "@/components/Providers/AppNotifications";
import QueryProvider from "@/components/Providers/QueryProvider";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

export const generateMetadata = async ({
  params,
}: LocaleLayoutProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.root" });

  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(env("NEXT_PUBLIC_SITE_URL")),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
    openGraph: {
      type: "website",
      siteName: title,
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
};

const LocaleLayout = async ({ children, params }: LocaleLayoutProps) => {
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
      <body className={inter.className}>
        <MantineProvider defaultColorScheme="auto">
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              <AppNotifications />
              {children}
            </QueryProvider>
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
