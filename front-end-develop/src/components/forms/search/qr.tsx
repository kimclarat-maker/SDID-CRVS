import { useContext, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import SelectDropdown from "@/components/select";
import { ButtonToolbar, IconButton, Stack, Text } from "rsuite";
import Alert from "@/components/alert";
import Button from "@/components/button";
import { LanguageContext } from "@/context/LanguageContext";
import Icon from "@/components/icon";
import toastMessage from "@/utils/common/toastMessage";
import { useNavigate } from "react-router-dom";
import { fetchPrenrollmentByPrenrollmentNumber } from "@/api/prenrollment";
import { Prenrollment } from "@/types/Prenrollment";

interface CameraDropdownype {
  label: string;
  value: string;
}

const QRScanner = ({
  getResult,
  handleClose,
}: {
  getResult: (search: string, data: Prenrollment) => void;
  handleClose: (b: boolean) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<any>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const { translation } = useContext(LanguageContext);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const codeReader = useRef(new BrowserQRCodeReader());

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const videoDevices = await BrowserQRCodeReader.listVideoInputDevices();

        setDevices(videoDevices);

        const ankerCamera = videoDevices.find((device) =>
          device.label.toLowerCase().includes("anker")
        );

        setSelectedDeviceId(
          ankerCamera?.deviceId || videoDevices[0]?.deviceId || null
        );
      } catch (err: any) {
        setError("Could not list video devices: " + err.message);
      }
    };

    fetchDevices();

    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    startScanning();

    return () => {
      controlsRef.current?.stop();
    };
  }, [selectedDeviceId]);

  const handleDeviceChange = (event: CameraDropdownype) => {
    setResult(null);
    setError(null);
    setSelectedDeviceId(event);
  };

  const startScanning = () => {
    setResult(null);
    setError(null);
    setCapturedImage(null);
    if (!selectedDeviceId || !videoRef.current) return;

    controlsRef.current?.stop();

    codeReader.current
      .decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error, controls) => {
          if (result) {
            const image = captureImageFromVideo();
            setCapturedImage(image || null);
            setResult(result.getText());

            controls.stop();
          }
          if (error && !(error.name === "NotFoundException")) {
            setError(error.message);
          }
        }
      )
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((err: any) => {
        setError("Error starting camera: " + err.message);
      });
  };

  const captureImageFromVideo = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    }
    return null;
  };

  const handleSubmit = async () => {
    try {
      if (!result) return toastMessage("error", translation.invalid_qr_code);
      setSubmitting(true);

      const data: any = await fetchPrenrollmentByPrenrollmentNumber(result);

      getResult(result, data);

      handleClose(true);
    } catch (error) {
      toastMessage("error", error);
      setSubmitting(false);
    }
  };

  return (
    <div>
      {devices.length > 1 && (
        <div>
          <SelectDropdown
            name="camera"
            value={selectedDeviceId || ""}
            onChange={handleDeviceChange}
            options={devices.map((el) => {
              return {
                label: `${el.label || `Camera ${el.deviceId}`}`,
                value: el.deviceId,
              };
            })}
          />
        </div>
      )}

      {capturedImage && (
        <div style={{ marginTop: 10 }}>
          <img
            src={capturedImage}
            alt="Captured QR"
            style={{ width: "100%", maxWidth: 300, marginTop: 8 }}
          />
          <br />
        </div>
      )}

      {!result && !capturedImage && (
        <video ref={videoRef} style={{ width: "100%", maxWidth: "500px" }} />
      )}

      {result && (
        <div>
          <div></div>

          <Stack style={{ margin: "0.5rem 0" }} spacing={16}>
            <Stack.Item grow={1}>
              <Text>
                {translation.result}:<strong> {result}</strong>
              </Text>
            </Stack.Item>
            <Stack.Item>
              <IconButton
                icon={<Icon name="refresh" />}
                onClick={() => startScanning()}
              />
            </Stack.Item>
          </Stack>
        </div>
      )}
      {error && <Alert type="error" message={error} />}

      <br />
      <Stack style={{ padding: "0.5rem" }}>
        <Stack.Item>
          <Button
            text={translation.close}
            onClick={() => handleClose(false)}
            testId="close"
            appearance="default"
          />
        </Stack.Item>
        <Stack.Item grow={1} />
        <Stack.Item>
          <ButtonToolbar>
            <Button
              text={translation.search}
              loading={isSubmitting}
              onClick={handleSubmit}
              testId="search"
              disabled={!result}
            />
          </ButtonToolbar>
        </Stack.Item>
      </Stack>
    </div>
  );
};

export default QRScanner;
