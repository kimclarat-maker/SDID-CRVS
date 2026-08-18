import { LanguageContext } from "@/context/LanguageContext";
import { useContext, useEffect } from "react";
import Input from "@/components/input";
import SelectDropdown from "@/components/select";
import Button from "@/components/button";
import { Modal } from "rsuite";
import { useFetchCenters } from "@/hooks/useCenters";
import { AddTransferType } from "@/types/Transfers";

type FormTypes = {
  errors: any;
  handleSubmit: () => void;
  isSubmitting: boolean;
  values: any;
  setFieldValue: any;
  handleClose?: () => void;
  selectedData?: AddTransferType;
  setValues?: (data: any) => void;
};

export default function TransferForm({
  errors,
  handleSubmit,
  isSubmitting,
  values,
  handleClose,
  setFieldValue,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  const { centers, loadingCenters, fetchCentersData } =
    useFetchCenters("dropdown");

  useEffect(() => {
    fetchCentersData({
      offset: 0,
      limit: 10,
      status: "active",
    });
  }, []);

  return (
    <div className="rs-modal-body">
      <div>
        <div className="row">
          <div className="col-md-6">
            <SelectDropdown
              options={centers}
              loading={loadingCenters}
              name="origin"
              label={translation.origin}
              placeholder={translation.select}
              required
              value={values.origin}
              onChange={(value) => setFieldValue("origin", value)}
              error={errors.origin}
            />
          </div>

          <div className="col-md-6">
            <SelectDropdown
              options={centers}
              loading={loadingCenters}
              name="destination"
              label={translation.destination}
              placeholder={translation.select}
              required
              value={values.destination}
              onChange={(value) => setFieldValue("destination", value)}
              error={errors.destination}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <Input
              name="startDate"
              label={translation.start_date}
              value={values.startDate}
              onChange={(value) => setFieldValue("startDate", value)}
              error={errors.startDate}
              type="date"
            />
          </div>

          <div className="col-md-6">
            <Input
              name="endDate"
              label={translation.end_date}
              value={values.endDate}
              onChange={(value) => setFieldValue("endDate", value)}
              error={errors.endDate}
              type="date"
            />
          </div>
        </div>
      </div>
      <Modal.Footer>
        <Button
          text={translation.cancel}
          onClick={() => (handleClose ? handleClose() : null)}
          appearance="default"
        />
        <Button
          text={translation.submit}
          onClick={handleSubmit}
          loading={isSubmitting}
        />
      </Modal.Footer>
    </div>
  );
}
