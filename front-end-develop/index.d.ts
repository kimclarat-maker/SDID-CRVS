declare module "rwanda";
declare module "react-grid-carousel";
declare module "react-qr-scanner";
declare module "sockjs-client/dist/sockjs" {
  import SockJS from "@types/sockjs-client";

  export = SockJS;
  export as namespace SockJS;
}

declare module "@/libs/wacom-sdk/signature-sdk.js" {
  const SigSDK: any;
  export default SigSDK;
}

declare module "@/libs/wacom-sdk/stu_capture/stu-sdk.min.js" {
  const com: any;
  export default com;
}

declare module "@/libs/wacom-sdk/stuCaptDialog.js" {
  const StuCaptDialog: any;
  export default StuCaptDialog;
}

declare module "javascript-signature-sdk";

declare module "openjpeg";
