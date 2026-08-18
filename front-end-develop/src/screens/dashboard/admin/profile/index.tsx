import Icon from "@/components/icon";
import Loading from "@/components/loader";
import { useFetchCitizenInfoPerInstitution } from "@/hooks/nida/useCitizenInfo";
import FormLayout from "@/layout/form/formLayout";
import { goBack } from "@/utils/common/goBack";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconButton } from "rsuite";

function IdentifierProfile() {
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { loadingCitizen, fetchCitizenData, citizenData } =
    useFetchCitizenInfoPerInstitution();

  useEffect(() => {
    if (!identifier) return;
    fetchCitizenData(identifier);
  }, []);
  return <></>;
}

export default IdentifierProfile;
