import { LanguageContext } from "@/context/LanguageContext";
import { useContext } from "react";
import Input from "@/components/input";
import RadioGroup from "@/components/radio/group";
import Radio from "@/components/radio";
import SelectDropdown from "@/components/select";

type FormTypes = {
  errors: any;
  values: any;
  setFieldValue: any;
  enableCapture: boolean;
  deviceSerialNumber?: string;
};

export default function IrisSpecsForm({
  errors,
  values,
  setFieldValue,
  enableCapture,
  deviceSerialNumber,
}: FormTypes) {
  const { translation } = useContext(LanguageContext);

  return (
    <div className="row">
      <div className="col-md-12">
        <Input
          name="device"
          label={translation.connected_device}
          placeholder={translation.no_device_connected}
          required
          value={deviceSerialNumber}
          onChange={(value) => setFieldValue("device", value)}
          error={errors.device}
          testId="device"
          disabled
          type="rsuite"
        />
      </div>
      <div className="col-md-12">
        <SelectDropdown
          options={[
            {
              label: "Right",
              value: 1,
            },
            {
              label: "Left",
              value: 2,
            },
            {
              label: "Both",
              value: 3,
            },
            {
              label: "Either",
              value: 4,
            },
          ]}
          name="eye"
          label={translation.eye_selection}
          placeholder={translation.select}
          required
          value={values.eye}
          onChange={(value) => setFieldValue("eye", value)}
          error={errors.eye}
          testId="eye"
          disabled={!enableCapture}
          type="rsuite"
        />
      </div>
      <div className="col-md-12" hidden>
        <SelectDropdown
          options={[
            { label: "VGA Iris Image", value: 1 },
            { label: "Kind7 Iris Image", value: 2 },
            { label: "Kind7 ≤1.5KB", value: 3 },
            { label: "Kind7 ≤2.5KB", value: 4 },
            { label: "Kind7 ≤3.5KB", value: 5 },
            { label: "Kind7 ≤5KB", value: 6 },
          ]}
          name="imageType"
          label={translation.output_image_type}
          placeholder={translation.select}
          required
          value={values.imageType}
          onChange={(value) => setFieldValue("imageType", value)}
          error={errors.imageType}
          testId="imageType"
          disabled
          type="rsuite"
        />
      </div>
      <div className="col-md-12">
        <RadioGroup
          name={translation.capture_mode}
          onChange={(value) => setFieldValue("captureType", value)}
          value={values.captureType}
          disabled
        >
          {[
            {
              label: "Auto",
              value: 0,
            },
            // {
            //   label: "Manual",
            //   value: 1,
            // },
          ].map((el: any, i) => {
            return (
              <Radio
                name={el.label}
                label={el.label}
                value={el.value}
                key={i}
                checked={values.captureType === el.value}
              />
            );
          })}
        </RadioGroup>
      </div>
      <div className="col-md-12" hidden>
        <Input
          name="timeoutSeconds"
          label={translation.timeout}
          placeholder={translation.timeout}
          required
          value={values.timeoutSeconds}
          onChange={(value) => setFieldValue("timeoutSeconds", value)}
          error={errors.timeoutSeconds}
          testId="timeoutSeconds"
          disabled
        />
      </div>
      <div className="col-md-12" hidden>
        <SelectDropdown
          options={[
            { label: "Speed", value: 0 },
            { label: "Quality", value: 1 },
            { label: "Multiple", value: 2 },
          ]}
          name="priority"
          label={translation.priority}
          placeholder={translation.select}
          required
          value={values.priority}
          onChange={(value) => setFieldValue("priority", value)}
          error={errors.priority}
          testId="priority"
          disabled
          type="rsuite"
        />
      </div>
      <div className="col-md-12 mb-3" hidden>
        <Radio
          name="beeper"
          label={translation.beep}
          value={values.beeper}
          checked={values.beeper}
          disabled
        />
        <Radio
          name="whiteLED"
          label={translation.white_LED}
          value={values.whiteLED}
          checked={values.whiteLED}
          disabled
        />
      </div>
      <div className="col-md-12" hidden>
        <SelectDropdown
          options={[
            { label: "Off", value: 0 },
            { label: "Hard", value: 1 },
            { label: "Pattern", value: 2 },
            { label: "Soft", value: 3 },
          ]}
          name="lensDetection"
          label={translation.detect_lenses}
          placeholder={translation.select}
          required
          value={values.lensDetection}
          onChange={(value) => setFieldValue("lensDetection", value)}
          error={errors.lensDetection}
          testId="lensDetection"
          disabled
          type="rsuite"
        />
      </div>
    </div>
  );
}
