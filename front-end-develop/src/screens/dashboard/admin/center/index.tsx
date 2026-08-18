import { useContext, useState } from "react";
import Modal from "@/components/Modal";
import Add from "./add";
import { ButtonToolbar, Heading, Stack } from "rsuite";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import CustomTabs from "@/components/tabs";
import DataCenters from "./data";

function Centers() {
  const { translation } = useContext(LanguageContext);
  const [filters, setFilters] = useState();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Stack>
        <Stack.Item grow={1}>
          <Heading level={5}>{translation.centers}</Heading>
        </Stack.Item>
        <Stack.Item>
          <ButtonToolbar>
            {/* <Button
              text={translation.import}
              startIcon="attach_file"
              onClick={() => alert("Coming soon")}
              appearance="ghost"
            />
            <Button
              text={translation.export}
              startIcon="download"
              onClick={() => alert("Coming soon")}
              appearance="ghost"
            /> */}
            <Button
              text={translation.add}
              startIcon="add"
              onClick={() => setOpen(true)}
            />
          </ButtonToolbar>
        </Stack.Item>
      </Stack>

      <CustomTabs
        options={[
          {
            title: translation.active,
            data: <DataCenters status="active" />,
          },
          {
            title: translation.inactive,
            data: <DataCenters status="inactive" />,
          },
        ]}
      />
      <Modal
        show={open}
        handleClose={() => setOpen(false)}
        title={translation.account}
      >
        <Add handleClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export default Centers;
