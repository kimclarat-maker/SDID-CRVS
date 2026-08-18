import React from "react";
import {
  Table as LibTable,
  Popover,
  Dropdown,
  Whisper,
  IconButton,
} from "rsuite";
import Icon from "@/components/icon";
import { ActionType } from "@/types/Table";

const { Cell } = LibTable;

interface PropsType {
  actions: ActionType[];
  status?: string;
  rowData?: any;
}

export const ActionCell: React.FC<PropsType> = ({
  rowData,
  actions,
  status,
  ...props
}) => {
  const renderMenu = (
    {
      onClose,
      left,
      top,
      className,
    }: { onClose?: () => void; left?: any; top?: any; className?: string },
    ref: React.Ref<any>,
    rowData: any
  ) => {
    const handleSelect = (eventKey: string | undefined) => {
      onClose && onClose();
      const action = actions.find((action) => action.name === eventKey);
      if (action && action.onClick) {
        action.onClick(rowData);
      }
    };

    return (
      <Popover ref={ref} className={className} full>
        <Dropdown.Menu onSelect={handleSelect}>
          {actions.map((action, i) => {
            if (
              !status ||
              (status &&
                action?.availabilityWhen &&
                action?.availabilityWhen?.includes(status))
            ) {
              return (
                <Dropdown.Item
                  eventKey={action.name}
                  style={{ left, top }}
                  key={i}
                  data-testid={action.testid}
                >
                  <div className="d-flex gap-2 align-items-center">
                    {action.icon && <Icon name={action.icon} />}
                    <span>{action.name}</span>
                  </div>
                </Dropdown.Item>
              );
            }
            return null;
          })}
        </Dropdown.Menu>
      </Popover>
    );
  };

  return (
    <Cell {...props} className="link-group" style={{ padding: 6 }}>
      <Whisper
        placement="bottom"
        trigger="click"
        speaker={(speakerProps, ref) => renderMenu(speakerProps, ref, rowData!)}
      >
        <IconButton appearance="subtle" icon={<Icon name="more_horiz" />} />
      </Whisper>
    </Cell>
  );
};
