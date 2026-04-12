"use client";

import { Anchor, type AnchorProps, type PolymorphicComponentProps } from "@mantine/core";

import { Link } from "@/i18n/navigation";

export type IntlLinkAnchorProps = PolymorphicComponentProps<typeof Link, AnchorProps>;

const IntlLinkAnchor = (props: IntlLinkAnchorProps) => (
  <Anchor component={Link} {...props} />
);

export default IntlLinkAnchor;
