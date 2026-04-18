"use client";

import { ActionIcon, Menu } from "@mantine/core";
import { IconDotsVertical } from "@tabler/icons-react";

import type { IssueMenuItem } from "../types";

interface IssueCardMenuProps {
  items: IssueMenuItem[];
  disabled?: boolean;
}

const IssueCardMenu = ({ items, disabled = false }: IssueCardMenuProps) => {
  if (items.length === 0) return null;

  return (
    <Menu shadow="md" width={220} withinPortal position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          disabled={disabled}
          aria-label="Issue actions"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <IconDotsVertical size={14} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {items.map((item, index) => {
          if (item.kind === "divider") {
            return <Menu.Divider key={index} />;
          }
          return (
            <Menu.Item
              key={index}
              color={item.color}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
            >
              {item.label}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
};

export default IssueCardMenu;
