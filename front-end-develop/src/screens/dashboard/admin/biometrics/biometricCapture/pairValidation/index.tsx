import Input from "@/components/input";
import { LanguageContext } from "@/context/LanguageContext";
import { isValidEmail } from "@/utils/common/validateEmail";
import React, { useContext, useState } from "react";
import { Avatar, Heading, List, Stack, Text } from "rsuite";
import userImagePlaceholder from "@/assets/userPhotoPlaceholder.png";
import Button from "@/components/button";
import { fetchAccounts } from "@/api/accounts";
import Loading from "@/components/loader";
import toastMessage from "@/utils/common/toastMessage";
import { getStorage } from "@/utils/storage";
import { AccountType } from "@/types/Account";

interface Props {
  setActiveIndex: (index: number) => void;
  setSelectedAccount: (account: any) => void;
  isStartedOnline?: boolean;
}
interface ResultType {
  photo: string;
  firstName: string;
  lastName: string;
}

const PairValidation: React.FC<Props> = ({
  setActiveIndex,
  setSelectedAccount,
  isStartedOnline,
}) => {
  const { translation } = useContext(LanguageContext);
  const [error, setError] = useState("");
  const [pairVal, setValue] = useState("");
  const [result, setResult] = useState<ResultType[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async (txt: string) => {
    try {
      setLoading(true);
      let params = {};

      if (txt.includes("@")) {
        params = {
          email: txt,
        };
      } else {
        params = {
          idNumber: txt,
        };
      }
      const { data } = await fetchAccounts(params, isStartedOnline);

      setResult(data.data);
      setLoading(false);
    } catch (error) {
      setResult([]);
      setLoading(false);
    }
  };

  const handleSelect = async (item: AccountType) => {
    const user = await getStorage();

    if (
      item.email === user?.account?.email ||
      item.idNumber === user?.account?.idNumber
    ) {
      return toastMessage(
        "error",
        "Enrollment can not be approved by the same officer"
      );
    }

    setActiveIndex(1);
    setSelectedAccount(item);
  };

  return (
    <div>
      <div className="mb-2">
        <Heading level={5}>
          <span className="textPrimary textBold">
            {translation.pair_validation}
          </span>
        </Heading>
      </div>
      <Text muted>{translation.pair_validation_description}</Text>
      <br />
      <Input
        name="pairVal"
        label={translation.pair_val_label}
        placeholder={translation.pair_val_placeholder}
        required
        leftIcon="person"
        error={error}
        onChange={(e) => {
          setValue(e);

          if (isValidEmail(e) || e?.length === 16) {
            setError("");
            onSearch(e);
          } else {
            setError("Invalid email or id number");
          }
        }}
      />
      {loading ? (
        <center>
          <Loading />
        </center>
      ) : (
        result?.length > 0 && (
          <List bordered>
            {result.map((el: ResultType, i: number) => {
              return (
                <List.Item key={i}>
                  <Stack spacing={16}>
                    <Stack.Item>
                      <Avatar
                        circle
                        size="sm"
                        src={el.photo || userImagePlaceholder}
                      />
                    </Stack.Item>
                    <Stack.Item grow={1}>
                      <Text>
                        {el.firstName} {el.lastName}
                      </Text>
                    </Stack.Item>
                    <Stack.Item>
                      <Button
                        text={translation.select}
                        onClick={() => handleSelect(el)}
                      />
                    </Stack.Item>
                  </Stack>
                </List.Item>
              );
            })}
          </List>
        )
      )}
    </div>
  );
};

export default PairValidation;
