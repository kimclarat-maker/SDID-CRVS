import Icon from "@/components/icon";
import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { List, Text } from "rsuite";

interface VerificationOptionsProps {
  options: { name: string; route: string; active: boolean; icon: string }[];
}

const VerificationOptions = ({ options }: VerificationOptionsProps) => {
  const { translation } = useContext(LanguageContext);
  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Text className="textBold">
          {translation.other_verification_options}
        </Text>
      </div>
      <List bordered>
        {options.map((option, i) =>
          !option.active ? (
            <List.Item key={i} className="d-flex align-items-center gap-2">
              <Icon
                name={option.icon}
                styles={{ color: "var(--primary-color)" }}
              />
              <Link
                to={option.route}
                className="d-flex align-items-center gap-3"
              >
                <Text className="textBold textPrimary">{option.name}</Text>
              </Link>
            </List.Item>
          ) : null
        )}
      </List>
    </div>
  );
};

export default VerificationOptions;
