import { useCallback, useEffect } from "react";
import { SignatureState, IDevice, defaultConfig } from "@/types/signatureTypes";
import SigSDK from "javascript-signature-sdk";
import com from "@/libs/wacom-sdk/stu_capture/stu-sdk.min.js";
import StuCaptDialog from "@/libs/wacom-sdk/stuCaptDialog.js";
import toastMessage from "@/utils/common/toastMessage";

let countFailedTimes = 0;
const lsDeviceStr = localStorage.getItem("SDID_STU_DEVICE");

export const useSignatureSDK = (
  state: SignatureState,
  updateState: (updates: Partial<SignatureState>) => void,
  enableCapture: boolean
) => {
  const initSDK = useCallback(async () => {
    try {
      if (!state.supportsWebHID) return;

      updateState({ initSDKLoading: true });

      const sdk = await new SigSDK();
      const docHash = new sdk.Hash(sdk.HashType.None);
      const sigObj = new sdk.SigObj();

      updateState({
        sigSDK: sdk,
        documentHash: docHash,
        mSigObj: sigObj,
        sdkInitialized: true,
        initSDKLoading: false,
      });
    } catch (error) {
      console.error("Error initializing SigSDK:", error);
      // toastMessage("error", "Failed to initialize signature SDK");
      updateState({ initSDKLoading: false });
    }
  }, [state.supportsWebHID, updateState]);

  const initLicense = useCallback(async () => {
    try {
      if (!enableCapture || !state.mSigObj) return;

      updateState({ initLicenseLoading: true });

      const ok = state.mSigObj.setLicence(
        "af4ff693-1041-4a9e-b709-3c56567d3464",
        "LlOhOtccZUi9CwIzD87OQJS/aXBJWNzrOacN6rfMs0cf4KOqxLQ+GSF5fJn9GMa3jG8a1bkhcZgrHU9VgS/9JQ=="
      );

      if (ok) {
        updateState({ licenseInitialized: true });

        if (lsDeviceStr && lsDeviceStr !== "{}") {
          await initDevices();
        }
      }
    } catch (error) {
      console.error("Unable to set license:", error);
      toastMessage("error", "Failed to initialize license");
    } finally {
      updateState({ initLicenseLoading: false });
    }
  }, [enableCapture, state.mSigObj, updateState]);

  const initDevices = useCallback(async () => {
    try {
      if (!enableCapture) return;

      let devices: IDevice[] = [];

      if (lsDeviceStr && lsDeviceStr !== "{}") {
        devices = await (navigator as any).hid.getDevices();
      } else {
        devices = await com.WacomGSS.STU.UsbDevice.requestDevices();
      }

      if (!devices?.length) {
        throw new Error("No STU devices found");
      }

      let selectedDevice: IDevice | undefined;

      if (lsDeviceStr && lsDeviceStr !== "{}") {
        const storedDevice = JSON.parse(lsDeviceStr);
        const device = devices.find(
          (d) =>
            storedDevice?.vendorId === d.vendorId &&
            storedDevice?.productId === d.productId &&
            storedDevice?.productName === d.productName
        );
        selectedDevice = device;
      } else {
        selectedDevice = devices[0];
        localStorage.setItem(
          "SDID_STU_DEVICE",
          JSON.stringify({
            productId: selectedDevice?.productId,
            productName: selectedDevice?.productName,
            vendorId: selectedDevice?.vendorId,
          })
        );
      }

      updateState({ devices, selectedDevice });
    } catch (error) {
      console.error("Failed to initialize STU devices:", error);
      localStorage.removeItem("SDID_STU_DEVICE");

      if (countFailedTimes === 0) {
        countFailedTimes++;
        await initDevices();
        return;
      }

      toastMessage("error", "Failed to initialize STU devices");
    }
  }, [enableCapture, updateState]);

  return {
    initSDK,
    initLicense,
    initDevices,
  };
};

export const useSignatureCapture = (
  state: SignatureState,
  updateState: (updates: Partial<SignatureState>) => void
) => {
  const cancelCapture = useCallback(
    (viaCallback = false) => {
      try {
        if (!viaCallback && state.capDialog) {
          state.capDialog.cancel();
        }
      } catch (error) {
        console.error("Failed to cancel capture:", error);
      }

      updateState({ capturing: false, capDialog: undefined });
    },
    [state.capDialog, updateState]
  );

  const clearCapture = useCallback(
    (viaCallback = false) => {
      try {
        if (!viaCallback && state.capDialog) {
          state.capDialog.clear();
        }
      } catch (error) {
        console.error("Failed to clear capture:", error);
      }
    },
    [state.capDialog]
  );

  const renderSignature = useCallback(async () => {
    try {
      if (!state.mSigObj) throw new Error("Signature object not set");

      const width = Math.trunc(
        (96 * state.mSigObj.getWidth(false) * 0.01) / 25.4
      );
      const height = Math.trunc(
        (96 * state.mSigObj.getHeight(false) * 0.01) / 25.4
      );

      const scaleWidth = 300 / width;
      const scaleHeight = 200 / height;
      const scale = Math.min(scaleWidth, scaleHeight);

      let renderWidth = Math.trunc(width * scale);
      const renderHeight = Math.trunc(height * scale);

      if (renderWidth % 4 !== 0) {
        renderWidth += renderWidth % 4;
      }

      const img = await state.mSigObj.renderBitmap(
        renderWidth,
        renderHeight,
        "image/png",
        4,
        "#000F55",
        "white",
        0,
        0,
        0x400000
      );

      const txt = await state.mSigObj?.getTextData(
        state.sigSDK.TextFormat.BASE64
      );

      updateState({ sigImg: img, sigTxt: txt });
    } catch (error) {
      console.error("Failed to render signature:", error);
      toastMessage("error", "Failed to render signature");
    }
  }, [state.mSigObj, state.sigSDK, updateState]);

  const submitCapture = useCallback(
    async (viaCallback = false) => {
      try {
        if (viaCallback) {
          state.capDialog?.accept();
        }
        await renderSignature();
      } catch (error) {
        console.error("Failed to submit capture:", error);
        toastMessage("error", "Failed to submit signature");
      } finally {
        updateState({ capturing: false });
      }
    },
    [state.capDialog, renderSignature, updateState]
  );

  const startCapture = useCallback(async () => {
    try {
      if (!state.selectedDevice) {
        throw new Error("No device selected");
      }

      updateState({ capDialog: undefined, capturing: true });

      const devices: IDevice[] = await (navigator as any).hid.getDevices();
      const navDevice = devices?.find(
        (d) =>
          d?.productId === state.selectedDevice?.productId &&
          d?.productName === state.selectedDevice?.productName &&
          d?.vendorId === state.selectedDevice?.vendorId
      );

      const newConfig = {
        ...state.config,
        stuDevice: navDevice,
      };

      const stuCapDialog = new StuCaptDialog(state.sigSDK, newConfig);

      // Event listeners
      stuCapDialog.addEventListener("ok", () => submitCapture(true));
      stuCapDialog.addEventListener("clear", () => clearCapture(true));
      stuCapDialog.addEventListener("cancel", () => cancelCapture(true));

      await stuCapDialog.open(
        state.mSigObj,
        state.who,
        state.why,
        [],
        state.sigSDK.KeyType.SHA512,
        state.documentHash
      );

      updateState({ capDialog: stuCapDialog, config: newConfig });
    } catch (error) {
      console.error("Failed to start capture:", error);
      toastMessage("error", "Failed to start signature capture");
      updateState({ capturing: false });
    }
  }, [state, updateState, submitCapture, clearCapture, cancelCapture]);

  return {
    cancelCapture,
    clearCapture,
    submitCapture,
    startCapture,
    renderSignature,
  };
};
