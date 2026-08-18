import "./styles.css";
import { ButtonToolbar, Panel, PanelGroup, Stack, Tag, Text } from "rsuite";
import Identification from "@/components/citizenProfile/identification";
import BasicInformation from "@/components/citizenProfile/basicInformation";
import PlaceOfRegistration from "@/components/citizenProfile/placeOfRegistration";
import ResidentialAddress from "@/components/citizenProfile/residentialAddress";
import Parent from "@/components/citizenProfile/parent";
import Spouse from "@/components/citizenProfile/spouse";
import Card from "../card/PanelCard";

interface Props {
  data: any;
}

function CitizenProfile({ data }: Props) {
  if (Array.isArray(data)) return data;
  return (
    <>
      <PanelGroup accordion defaultActiveKey="basic_information">
        <Card title="basic_information" eventKey="basic_information">
          <BasicInformation data={data} />
        </Card>
        <Card title="identification_number" eventKey="identification_number">
          <Identification {...data} type="prenrollment" />
        </Card>
        <Card title="place_of_registration" eventKey="place_of_registration">
          <PlaceOfRegistration data={data} />
        </Card>
        <Card title="residential_address" eventKey="residential_address">
          <ResidentialAddress data={data} />
        </Card>
        <Card title="parent_information" eventKey="parent_information">
          <Parent data={data} />
        </Card>
        <Card title="spouse_information" eventKey="spouse_information">
          <Spouse data={data} />
        </Card>
      </PanelGroup>
    </>
  );
}

export default CitizenProfile;
