"use client";

import { Text, TextProps, Title, TitleProps } from "@mantine/core";
import { ReactNode } from "@tabler/icons-react";

type TypographyType =
  | "heading-01"
  | "heading-02"
  | "heading-03"
  | "body-01"
  | "body-02"
  | "caption-01"
  | "caption-02"
  | "subtitle-01"
  | "subtitle-02";

interface TypographyProps extends Omit<TextProps & TitleProps, "type"> {
  type: TypographyType;
  children: ReactNode;
  className?: string;
}

const typographyConfig: Record<
  TypographyType,
  {
    component: "title" | "text";
    props: Omit<TitleProps & TextProps, "children">;
  }
> = {
  "heading-01": {
    component: "title",
    props: {
      order: 1,
      size: "56px" as any,
      fw: 900,
      lh: 1.2,
    },
  },
  "heading-02": {
    component: "title",
    props: {
      order: 2,
      size: "40px" as any,
      fw: 800,
      lh: 1.3,
    },
  },
  "heading-03": {
    component: "title",
    props: {
      order: 3,
      size: "28px" as any,
      fw: 700,
      lh: 1.4,
    },
  },
  "body-01": {
    component: "text",
    props: {
      size: "16px" as any,
      fw: 400,
      lh: 1.6,
    },
  },
  "body-02": {
    component: "text",
    props: {
      size: "15px" as any,
      fw: 400,
      lh: 1.6,
    },
  },
  "caption-01": {
    component: "text",
    props: {
      size: "14px" as any,
      fw: 400,
      lh: 1.5,
      c: "dimmed",
    },
  },
  "caption-02": {
    component: "text",
    props: {
      size: "12px" as any,
      fw: 400,
      lh: 1.4,
      c: "dimmed",
    },
  },
  "subtitle-01": {
    component: "text",
    props: {
      size: "18px" as any,
      fw: 600,
      lh: 1.5,
    },
  },
  "subtitle-02": {
    component: "text",
    props: {
      size: "16px" as any,
      fw: 600,
      lh: 1.5,
    },
  },
};

const Typography = ({
  type,
  children,
  className,
  ...props
}: TypographyProps) => {
  const config = typographyConfig[type];

  if (config.component === "title") {
    return (
      <Title className={className} {...config.props} {...props}>
        {children}
      </Title>
    );
  }

  return (
    <Text className={className} {...config.props} {...props}>
      {children}
    </Text>
  );
};

export default Typography;
