import { useContext, useEffect, useMemo, useState } from "react";

import { IconButton, Panel, PanelGroup, Stack, Text } from "rsuite";
import Address from "@/components/forms/address";
import Alert from "@/components/alert";
import { LanguageContext } from "@/context/LanguageContext";
import { getStorage } from "@/utils/storage";
import Icon from "@/components/icon";
import { useFormik } from "formik";
import { AddressType } from "@/types/OTP";
import { addressValidationSchema } from "@/validation/otp.validation";
import toastMessage from "@/utils/common/toastMessage";
import Button from "@/components/button";

interface Address {
  province?: AddressType | null;
  district?: AddressType | null;
  sector?: AddressType | null;
  cell?: AddressType | null;
  village?: AddressType | null;
  center?: AddressType | null;
}

function AddressStep({ formik }: { formik: any }) {
  const { translation } = useContext(LanguageContext);

  const [currentAddress, setCurrentAddress] = useState<any>({});
  const [isCurrentAddress, setIsCurrentAddress] = useState(true);

  useEffect(() => {
    const getILocalInfo = async () => {
      const address = await getStorage("applicantAddress", "local");

      setCurrentAddress(address);

      if (address && Object.keys(address).length > 0) {
        setIsCurrentAddress(true);
      }
    };
    getILocalInfo();
  }, []);

  return (
    <Panel>
      <div className="row">
        <div>
          <Stack spacing={16}>
            <Stack.Item>
              <IconButton
                circle
                icon={<Icon name="location_on" />}
                color="green"
                appearance="primary"
              />
            </Stack.Item>
            <Stack.Item>
              <Text muted>
                <Stack>
                  <Stack.Item>{translation.my_location}</Stack.Item>
                  <Stack.Item>
                    (<span style={{ color: "red" }}>*</span>)
                  </Stack.Item>
                </Stack>
              </Text>
            </Stack.Item>
          </Stack>
          <br />
        </div>

        <div>
          {isCurrentAddress &&
          currentAddress &&
          Object.keys(currentAddress).length > 0 ? (
            <div>
              <div>
                <Alert type="info">
                  <Stack>
                    <Stack.Item>
                      <Text className="textBold">
                        {translation.current_location_address}
                      </Text>
                      {!currentAddress || !currentAddress?.province ? (
                        <>
                          <Text muted>{translation.add_current_workplace}</Text>
                        </>
                      ) : (
                        <Text muted>{`${
                          currentAddress?.province?.name
                            ? currentAddress?.province?.name + ", "
                            : ""
                        }${
                          currentAddress?.district?.name
                            ? currentAddress?.district?.name
                            : ""
                        } ${
                          currentAddress?.sector?.name
                            ? currentAddress?.sector?.name + ", "
                            : ""
                        } ${
                          currentAddress?.cell?.name
                            ? currentAddress?.cell?.name + ", "
                            : ""
                        } ${
                          currentAddress?.village?.name
                            ? currentAddress?.village?.name
                            : ""
                        }`}</Text>
                      )}
                    </Stack.Item>
                    <Stack.Item grow={1} />
                    <Stack.Item>
                      <IconButton
                        appearance="primary"
                        color="green"
                        circle
                        icon={<Icon name="edit" />}
                        onClick={() => setIsCurrentAddress(!isCurrentAddress)}
                      />
                    </Stack.Item>
                  </Stack>
                </Alert>
              </div>
              <br />
            </div>
          ) : (
            <>
              <div>
                <Address
                  values={formik.values}
                  setFieldValue={formik.setFieldValue}
                  errors={formik.errors}
                  requiredFields={[
                    "province",
                    "district",
                    "sector",
                    "cell",
                    "village",
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default AddressStep;
