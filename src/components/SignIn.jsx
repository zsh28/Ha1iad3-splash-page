import { useEffect, useState } from "react";
import { AuthLayout, OAuthMethod, ParaModal, ExternalWallet } from "@getpara/react-sdk";
import para from "../clients/para";
import "@getpara/react-sdk/styles.css";
import Ha1iad3 from "../assets/Ha1iad3.png";

export default function SignIn() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");

  const checkAuthStatus = async () => {
    setIsLoading(true);
    setError("");

    try {
      const isAuthenticated = await para.isFullyLoggedIn();
      setIsConnected(isAuthenticated);

      if (isAuthenticated) {
        const wallets = await para.getWallets();
        const walletAddresses = Object.values(wallets).map((w) => w?.address);
        setWallet(walletAddresses.length > 0 ? walletAddresses[0] : "No Wallet Found");
      } else {
        setWallet(null);
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError(err.message || "An error occurred while checking authentication.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {isConnected ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
        >
          Connected
        </button>
      ) : (
        <button
          disabled={isLoading}
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
        >
          {isLoading ? "Checking..." : "Sign in with Para"}
        </button>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <ParaModal
        para={para}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          checkAuthStatus();
        }}
        theme={{
          foregroundColor: "#e4e3eb",
          backgroundColor: "#130a63",
          accentColor: "#000000",
          font: "Roboto",
          borderRadius: "md",
          mode: "dark",
        }}
        logo={Ha1iad3}
        authLayout={[AuthLayout.AUTH_FULL, AuthLayout.EXTERNAL_FULL]}
        externalWallets={[ExternalWallet.PHANTOM, ExternalWallet.BACKPACK, ExternalWallet.GLOW]}
        oAuthMethods={[OAuthMethod.APPLE, OAuthMethod.GOOGLE, OAuthMethod.TWITTER]}
        disablePhoneLogin={true}
        recoverySecretStepEnabled
        onRampTestMode={true}
      />
    </div>
  );
}