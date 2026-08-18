import Checkbox from "@/components/checkbox";
import { WithTooltip } from "@/components/withTooltip";
import capitalizeText from "@/utils/common/capitalizeText";
import { Link } from "react-router-dom";
import { List, Stack, Tag, Text } from "rsuite";

export const FieldItem = ({
  title,
  value,
  fieldName,
  handleCheckbox,
  selectedInformation,
  isDefault,
  removeEmpty,
  disabled,
  redFlagsInfo,
  prevInfo,
  url,
  isFromLogs,
}: {
  title: string;
  value?: string;
  fieldName: string;
  selectedInformation?: string[];
  handleCheckbox?: (name: string, value?: string) => void;
  isDefault?: boolean;
  removeEmpty?: boolean;
  disabled?: boolean;
  redFlagsInfo?: string[];
  prevInfo?: string;
  url?: string;
  isFromLogs?: boolean;
}) => {
  if (removeEmpty && !value) return;
  const checked =
    (Array.isArray(selectedInformation) &&
      (selectedInformation.includes(fieldName) ||
        selectedInformation.some(
          (el: any) =>
            typeof el === "object" &&
            el.field === fieldName &&
            el.value === value
        ))) ||
    false;

  return (
    <List.Item>
      <Stack className="item">
        <Stack.Item>
          {isDefault && (
            <div style={{ opacity: disabled ? 0 : 1 }}>
              <Checkbox
                name={fieldName}
                onChange={() =>
                  handleCheckbox && !disabled && isDefault
                    ? handleCheckbox(fieldName, value)
                    : null
                }
                checked={checked}
              />
            </div>
          )}
        </Stack.Item>
        <Stack.Item grow={1}>
          <div
            onClick={() =>
              handleCheckbox && isDefault && !disabled
                ? handleCheckbox(fieldName, value)
                : null
            }
          >
            <Text className={`item-title`}>{capitalizeText(title)}</Text>
          </div>
        </Stack.Item>
        <Stack.Item>
          <Stack>
            <Stack.Item>
              {(redFlagsInfo?.includes(fieldName) || prevInfo) && (
                <WithTooltip>
                  Prev:{prevInfo || "-"}, New: {value}
                </WithTooltip>
              )}
            </Stack.Item>
            <Stack.Item>
              {url ? (
                <Link className="textBold" to={url}>
                  {value}
                </Link>
              ) : (
                <>
                  {isFromLogs &&
                    value &&
                    value !== "" &&
                    prevInfo &&
                    prevInfo !== value && <Tag color="red">{prevInfo}</Tag>}
                  <Text className="textBold">{value}</Text>
                </>
              )}
            </Stack.Item>
          </Stack>
        </Stack.Item>
      </Stack>
    </List.Item>
  );
};
