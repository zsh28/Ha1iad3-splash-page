import * as React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletConnection = () => {
  return (
    <div className="py-4">
      <WalletMultiButton />
    </div>
  );
};

export default WalletConnection;
