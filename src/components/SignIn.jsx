import React, { useState } from "react";
import { AuthLayout, ParaModal } from "@getpara/react-sdk";
import { ExternalWallet } from "@getpara/react-sdk";
import { OAuthMethod } from "@getpara/react-sdk";
import para from "../clients/para";
import Ha1iad3 from "../assets/Ha1iad3.png";
import "@getpara/react-sdk/styles.css";

export default function SignIn() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Sign in with Para
      </button>
      <ParaModal
        para={para}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        logo={""}
        theme={{
          foregroundColor: "#ffffff",
          backgroundColor: "#2e2e61",
          accentColor: "#ebe2e2",
          font: "Roboto",
          borderRadius: "md",
        }}
        oAuthMethods={[OAuthMethod.GOOGLE, OAuthMethod.TWITTER, OAuthMethod.APPLE]}
        disablePhoneLogin
        authLayout={[AuthLayout.EXTERNAL_FULL]}
        externalWallets={[ExternalWallet.PHANTOM, ExternalWallet.BACKPACK, ExternalWallet.GLOW, ExternalWallet.WALLETCONNECT]}
        recoverySecretStepEnabled
        onRampTestMode={true}
      />
    </div>
  );
}
