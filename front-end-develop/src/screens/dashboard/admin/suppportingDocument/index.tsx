import List from "./list";
import { FilterContext } from "@/context/FilterContext";
import { useContext, useEffect, useState } from "react";
import { useFetchSupportingDocuments } from "@/hooks/useSupportingDocument";
import { useParams } from "react-router-dom";
import Modal from "@/components/Modal";
import Add from "./add";
import { LanguageContext } from "@/context/LanguageContext";
import Button from "@/components/button";
import PageHeader from "@/components/pageHeader";

function SupportingDocuments() {
  const { translation } = useContext(LanguageContext);
  const [openModal, setOpen] = useState(false);
  const { filters } = useContext(FilterContext);
  const { fieldName } = useParams();
  const { data, loading, fetchSupportingDocumentsData, totalPages } =
    useFetchSupportingDocuments();

  useEffect(() => {
    fetchData();
  }, [filters.accounts]);

  const fetchData = async () => {
    fetchSupportingDocumentsData({
      offset: filters?.sDocument?.offset || 0,
      limit: filters?.sDocument?.limit || 100,
      fieldName,
    });
  };

  return (
    <div className="row">
      <PageHeader
        title={translation.supporting_documents}
        action={
          <Button
            startIcon="add"
            text={translation.add}
            onClick={() => setOpen(true)}
          />
        }
      />

      <div data-testid="sDocument-list">
        <List
          data={data}
          loading={loading}
          fetchData={fetchData}
          totalPages={totalPages}
        />
      </div>

      <Modal
        show={openModal}
        title={translation.supporting_document}
        handleClose={() => setOpen(false)}
        size="lg"
      >
        <Add handleClose={() => setOpen(false)} getData={fetchData} />
      </Modal>
    </div>
  );
}

export default SupportingDocuments;
