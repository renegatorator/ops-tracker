"use client";

import { Button, type ButtonProps } from "@mantine/core";
import type { ReactNode } from "react";

type DisabledCtaButtonProps = Omit<ButtonProps, "onClick"> & {
  children: ReactNode;
  className?: string;
};

const DisabledCtaButton = (props: DisabledCtaButtonProps) => (
  <Button
    {...props}
    data-disabled
    aria-disabled
    onClick={(event) => event.preventDefault()}
  />
);

export default DisabledCtaButton;
