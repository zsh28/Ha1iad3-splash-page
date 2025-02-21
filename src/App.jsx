import React from "react";
import Navbar from "./components/navbar";
import Heading from "./components/heading";
import Body from "./components/body";
import StakingInterface from "./components/StakingInterface";
import SolanaProvider from "./components/solana-provider";
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <SolanaProvider>
      <Toaster position="bottom-right" />
      <div className="relative mx-auto min-h-screen bg-[#191a2c] px-4 sm:px-16 items-center text-center overflow-hidden">
        {/* Content */}
        <div className="relative z-10 mb-0">
          <Navbar />
          <Heading />
          <div className="-mt-5">
            <Body />
          </div>
        </div>
        <div className="transform scale-110 origin-top -mt-11">
          <StakingInterface />
        </div>

        {/* Top Left Glow */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#ffffff] opacity-[0.12] rounded-full filter blur-[80px] sm:blur-[200px] z-0" />

        {/* Top Right Glow */}
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#ffffff] opacity-[0.12] rounded-full filter blur-[80px] sm:blur-[200px] z-0" />

        {/* Concentric Circles */}
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] lg:w-[1200px] lg:h-[1200px] bg-[#191a2c] opacity-10 rounded-full translate-x-1/2 translate-y-1/2 z-0" />
        <div className="absolute bottom-0 right-0 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] lg:w-[800px] lg:h-[800px] bg-[#191a2c] opacity-20 rounded-full translate-x-1/2 translate-y-1/2 z-0" />
        <div className="absolute bottom-0 right-0 w-[100px] h-[100px] sm:w-[200px] sm:h-[200px] lg:w-[400px] lg:h-[400px] bg-[#191a2c] opacity-30 rounded-full translate-x-1/2 translate-y-1/2 z-0" />
      </div>
    </SolanaProvider>
  );
}
