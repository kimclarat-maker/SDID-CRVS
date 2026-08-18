import { IrisTypes } from "@/types/IrisTypes";
import * as StompJs from "@stomp/stompjs";
import { useState } from "react";
import SockJS from "sockjs-client";

// Create a new SockJS instance with proper configuration
const stompClient = StompJs.Stomp.over(
  () => new SockJS("https://localhost:9991/ws/iris-stomp")
);

export default stompClient;
