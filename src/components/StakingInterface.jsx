// src/components/StakingInterface.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  StakeProgram,
  Keypair,
} from "@solana/web3.js";
import { DEFAULT_VALIDATOR, DEFAULT_VALIDATOR_VOTE, TESTNET_VALIDATOR, TESTNET_VALIDATOR_VOTE } from "../constants/validators";
import { toast } from 'react-hot-toast';


const RENT_EXEMPTION = 0.002; // SOL
const TX_FEE = 0.000005; // SOL
const MIN_STAKE = 0.001; // SOL
const MIN_TOTAL = RENT_EXEMPTION + TX_FEE + MIN_STAKE;

const getSolscanLink = (signature) => {
  // testnet
  return `https://solscan.io/tx/${signature}?cluster=testnet`;
// for main net
  // return `https://solscan.io/tx/${signature}/`;
};

export default function StakingInterface() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [stakeType, setStakeType] = useState("native");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  // for main net
  // const [validatorVotePubkey] = useState(DEFAULT_VALIDATOR_VOTE);

  // for testnet
  const [validatorVotePubkey] = useState(TESTNET_VALIDATOR_VOTE);
  const [validatorInfo, setValidatorInfo] = useState(null);

  useEffect(() => {
    async function getBalance() {
      if (!publicKey) {
        setBalance(0);
        return;
      }

      try {
        const bal = await connection.getBalance(publicKey);
        setBalance((bal / LAMPORTS_PER_SOL).toFixed(5));
        console.log('Balance updated:', (bal / LAMPORTS_PER_SOL).toFixed(5), 'SOL');
      } catch (error) {
        setBalance(0);
      }
    }

    // get initial balance on connect
    getBalance();

    //set 10 second interval
    let intervalId;
    if (publicKey) {
      console.log('Starting balance polling...');
      intervalId = setInterval(() => {
        console.log('Checking balance...');
        getBalance();
      }, 10000);
    }

    // cleanup interval on unmount
    return () => {
      if (intervalId) {
        console.log('Stopping balance polling...');
        clearInterval(intervalId);
      }
    };
  }, [publicKey, connection]);

  useEffect(() => {
    async function fetchValidatorInfo() {
      try {
        const voteAccounts = await connection.getVoteAccounts();
        const validator = voteAccounts.current.find(

          // for testnet
          (v) => v.nodePubkey === TESTNET_VALIDATOR.toString()

          // for main net
          // (v) => v.nodePubkey === DEFAULT_VALIDATOR.toString()
        );

        if (validator) {
          setValidatorInfo({
            commission: validator.commission,
            activatedStake: validator.activatedStake / LAMPORTS_PER_SOL,
            epochCredits: validator.epochCredits,
          });
        }
      } catch (error) {
        console.error("Error fetching validator info:", error);
      }
    }

    fetchValidatorInfo();
  }, []);

  const handleStake = useCallback(async () => {
    if (!publicKey || !connection) {
      alert("Wallet not connected!");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    try {
      setLoading(true);

      // Create stake account and instructions
      const stakeAccount = Keypair.generate();
      const lamportsToStake = Math.floor(amount * LAMPORTS_PER_SOL);
      const stakeAccountRentExemption = 
        await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

      const createStakeAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: stakeAccount.publicKey,
        lamports: stakeAccountRentExemption + lamportsToStake,
        space: StakeProgram.space,
        programId: StakeProgram.programId,
      });

      const initStakeIx = StakeProgram.initialize({
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: publicKey,
          withdrawer: publicKey,
        },
        lockup: {
          epoch: 0,
          unixTimestamp: 0,
          custodian: PublicKey.default,
        },
      });

      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: publicKey,
        votePubkey: validatorVotePubkey,
      });

      // Build transaction with recent blockhash
      const transaction = new Transaction();
      const latestBlockhash = await connection.getLatestBlockhash();
      
      transaction.add(createStakeAccountIx, initStakeIx, delegateIx);
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;
      transaction.sign(stakeAccount); // Sign with stake account first

      // Get user signature
      const signedTx = await signTransaction(transaction);

      // Send transaction without waiting
      connection.sendRawTransaction(signedTx.serialize())
        .then(signature => {
          console.log("Staking transaction signature:", signature);
          
          toast.success(
            <div>
              Transaction sent! View on{' '}
              <a 
                href={getSolscanLink(signature)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline text-blue-500"
              >
                Solscan
              </a>
            </div>,
            {
              duration: 10000,
              style: {
                minWidth: '300px'
              }
            }
          );
        })
        .catch(error => {
          console.error("Error sending transaction:", error);
          toast.error("Failed to send transaction. Please try again.", {
            duration: 10000
          });
        });

      return signedTx;

    } catch (error) {
      console.error("Error staking SOL:", error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, amount, validatorVotePubkey, connection, signTransaction]);

  return (
    <div className="bg-[#191a2c] text-white p-6 rounded-lg max-w-md mx-auto">
      <div className="flex justify-between mb-4">
        <button
          className={`p-2 relative ${
            stakeType === "native" ? "underline-glow" : ""
          }`}
          onClick={() => setStakeType("native")}
        >
          Native Staking
        </button>
        <button
          className={`p-2 relative ${
            stakeType === "liquid" ? "underline-glow" : ""
          }`}
          onClick={() => setStakeType("liquid")}
          disabled
        >
          Liquid Staking (Coming Soon!)
        </button>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
            placeholder="0 SOL"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={() => setAmount((balance / 2).toFixed(5))}
              className="px-2 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
              disabled={!balance}
            >
              HALF
            </button>
            <button
              onClick={() => {
                const maxAmount = balance - RENT_EXEMPTION - TX_FEE;
                setAmount(Math.max(0, maxAmount).toFixed(5));
              }}
              className="px-2 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
              disabled={!balance}
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between">
          <p>Balance:</p>
          <p>{balance ? `${balance} SOL` : "0 SOL"}</p>
        </div>
        <div className="flex justify-between">
          <p>Validator:</p>
          {/* for main net */}
          {/* <p className="text-sm truncate" title={DEFAULT_VALIDATOR.toString()}>
            {DEFAULT_VALIDATOR.toString().slice(0, 8)}...
          </p> */}
          {/* for testnet */}
          <p className="text-sm truncate" title={TESTNET_VALIDATOR.toString()}>
            {TESTNET_VALIDATOR.toString().slice(0, 8)}...
          </p>
        </div>
        <div className="flex justify-between">
          <p>Commission:</p>
          <p>{validatorInfo?.commission ?? ".."}%</p>
        </div>
        <div className="flex justify-between">
          <p>Total Stake:</p>
          <p>
            {validatorInfo
              ? `${Math.floor(
                  validatorInfo.activatedStake
                ).toLocaleString()} SOL`
              : ".."}
          </p>
        </div>
        {/* <div className="flex justify-between">
          <p>Rent:</p>
          <p>0.002 SOL</p>
        </div> */}
        <div className="flex justify-between">
          <p>Unlock period:</p>
          <p>2-3 days</p>
        </div>
      </div>

      <button
        className={`w-full p-2 rounded ${
          loading
            ? "bg-gray-500"
            : balance < MIN_TOTAL || (amount && parseFloat(amount) < MIN_STAKE)
            ? "bg-[#9BEDFF] text-black"
            : !publicKey || !amount || parseFloat(amount) > balance
            ? "bg-gray-500"
            : "bg-[#0050fb]"
        }`}
        onClick={handleStake}
        disabled={
          !publicKey ||
          !amount ||
          parseFloat(amount) > balance ||
          parseFloat(amount) < MIN_STAKE ||
          balance < MIN_TOTAL ||
          loading
        }
      >
        {loading ? (
          "Staking..."
        ) : balance < MIN_TOTAL ? (
          <>
            <div>Minimum stake amount is {MIN_STAKE} SOL</div>
            <div>Minimum balance needed to stake is {MIN_TOTAL} SOL</div>
          </>
        ) : parseFloat(amount) < MIN_STAKE ? (
          <div>Minimum stake amount is {MIN_STAKE} SOL</div>
        ) : (
          "Stake SOL"
        )}
      </button>
    </div>
  );
}
