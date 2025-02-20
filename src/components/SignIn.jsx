import React, { useState } from "react";
import { ParaModal } from "@getpara/react-sdk";
import para from "../clients/para";
import Ha1iad3 from "../assets/Ha1iad3.png";
import "@getpara/react-sdk/styles.css";

function SignIn() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Sign in with Para</button>
      <ParaModal
        para={para}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appName="Your App Name"
        logo={""}
        theme={{ backgroundColor: "#ffffff", foregroundColor: "#000000" }}
        oAuthMethods={["GOOGLE", "TWITTER", "APPLE"]}
      />
    </div>
  );
}

export default SignIn;
