import { List } from "rsuite";
import Checkbox from "@/components/checkbox";
import Empty from "@/components/empty";
import { MaskedPhoneNumberType } from "@/types/MaskedPhoneNumber";

interface PhoneListProps {
  phoneNumbers: MaskedPhoneNumberType[];
  selectedPhoneNumber?: any;
  onSelect: (phone: MaskedPhoneNumberType) => void;
  noDataText: string;
  noPhoneDescription: string;
}

const PhoneList = ({
  phoneNumbers,
  selectedPhoneNumber,
  onSelect,
  noDataText,
  noPhoneDescription,
}: PhoneListProps) => {
  return phoneNumbers.length > 0 ? (
    <List bordered hover>
      {phoneNumbers.map((phone, i) => (
        <List.Item key={i} onClick={() => onSelect(phone)}>
          <Checkbox
            name="phoneNumber"
            label={phone.value}
            checked={
              selectedPhoneNumber &&
              phone.value === (selectedPhoneNumber.value || selectedPhoneNumber)
            }
            onChange={() => onSelect(phone)}
          />
        </List.Item>
      ))}
    </List>
  ) : (
    <Empty title={noDataText} description={noPhoneDescription} />
  );
};

export default PhoneList;
