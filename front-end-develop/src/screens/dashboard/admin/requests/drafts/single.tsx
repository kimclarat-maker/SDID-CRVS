import { useContext, useEffect } from "react";

import { LanguageContext } from "@/context/LanguageContext";
import { Link, useParams } from "react-router-dom";
import Identifiation from "@/components/citizenProfile/identification";
import Loading from "@/components/loader";
import Card from "@/components/card/PanelCard";
import { ButtonToolbar, PanelGroup, Text } from "rsuite";
import BasicInformation from "@/components/citizenProfile/basicInformation";
import PlaceOfRegistration from "@/components/citizenProfile/placeOfRegistration";
import ResidentialAddress from "@/components/citizenProfile/residentialAddress";
import Parent from "@/components/citizenProfile/parent";
import Spouse from "@/components/citizenProfile/spouse";
import Empty from "@/components/empty";
import { useFetchDraftById } from "@/hooks/useFetchDrafts";
import { Breadcrumb } from "rsuite";
import Button from "@/components/button";

function SingleDraft() {
  const { translation } = useContext(LanguageContext);
  const { id } = useParams();
  const { data, loading, fetchDraftByIdData } = useFetchDraftById();

  const fetchData = () => {
    if (id) {
      fetchDraftByIdData(id);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Loading isFullScreen />;
  if (!data)
    return (
      <Empty
        title={translation.no_data}
        description={translation.no_data_found_description + " " + id}
      />
    );

  return (
    <>
      <Breadcrumb separator={<div className="breadcrumb-separator">&gt;</div>}>
        <Breadcrumb.Item as={Link} to="/dashboard/admin/request">
          {translation.requests.toUpperCase()}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          <Text className="textBold">{translation.drafts.toUpperCase()}</Text>
        </Breadcrumb.Item>
      </Breadcrumb>
      <PanelGroup>
        <Card title="identification_number">
          <Identifiation type="prenrollment" {...data} />
        </Card>
        <Card title="basic_information">
          <BasicInformation data={data} />
        </Card>
        <Card title="place_of_registration">
          <PlaceOfRegistration data={data} />
        </Card>
        <Card title="residential_address">
          <ResidentialAddress data={data} />
        </Card>
        <Card title="parent_information">
          <Parent data={data} />
        </Card>
        <Card title="spouse_information">
          <Spouse data={data} />
        </Card>
      </PanelGroup>
      <br />
      <ButtonToolbar>
        <Button
          text={translation.continue}
          onClick={() => alert("comming soon")}
        />
        <Button
          text={translation.delete}
          onClick={() => alert("comming soon")}
          appearance="primary"
          color={"red"}
        />
      </ButtonToolbar>
    </>
  );
}

export default SingleDraft;
