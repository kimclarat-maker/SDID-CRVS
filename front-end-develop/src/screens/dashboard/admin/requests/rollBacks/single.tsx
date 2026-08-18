import List from "./list";
import { useContext, useEffect } from "react";
import { FilterContext } from "@/context/FilterContext";
import ReportFilters from "./filters";
import Header from "@/components/header";
import { LanguageContext } from "@/context/LanguageContext";
import { useFetchRollBacksById } from "@/hooks/useFetchRollBacks";
import { useParams } from "react-router-dom";
import CustomTabs from "@/components/tabs";
import Identifiation from "@/components/citizenProfile/identification";
import Loading from "@/components/loader";
import Card from "@/components/card/PanelCard";
import { PanelGroup } from "rsuite";
import BasicInformation from "@/components/citizenProfile/basicInformation";
import PlaceOfRegistration from "@/components/citizenProfile/placeOfRegistration";
import ResidentialAddress from "@/components/citizenProfile/residentialAddress";
import Parent from "@/components/citizenProfile/parent";
import Spouse from "@/components/citizenProfile/spouse";
import SupportingDocuments from "@/components/citizenProfile/supportingDocuments";
import LegalGuardian from "@/components/citizenProfile/legalGuardian";
import DigitalEmbassador from "@/components/citizenProfile/digitalEmbassador";
import Empty from "@/components/empty";

function Single() {
  const { filters } = useContext(FilterContext);
  const { translation } = useContext(LanguageContext);
  const { id } = useParams();
  const { data, loading, fetchRollBackByIdData } = useFetchRollBacksById();

  const fetchData = () => {
    if (id) {
      fetchRollBackByIdData(id);
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
    <CustomTabs
      options={[
        {
          title: translation.personal_information,
          data: (
            <>
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
            </>
          ),
        },
        {
          title: translation.supporting_documents,
          data: (
            <SupportingDocuments
              data={data.supportingDocuments}
              loading={loading}
            />
          ),
        },
        {
          title: translation.legal_guardian,
          data: (
            <LegalGuardian
              data={data.legalGuardianId ? [data.legalGuardianId] : []}
              loading={loading}
            />
          ),
        },
        {
          title: translation.digital_embassador,
          data: (
            <DigitalEmbassador
              data={
                data.digitalAmbassadorNid ? [data.digitalAmbassadorNid] : []
              }
              loading={loading}
            />
          ),
        },
      ]}
    />
  );
}

export default Single;
