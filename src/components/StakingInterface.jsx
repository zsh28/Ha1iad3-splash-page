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
import {
  MAINNET_VALIDATOR_ID,
  MAINNET_VALIDATOR_VOTE,
  TESTNET_VALIDATOR,
  TESTNET_VALIDATOR_VOTE,
} from "../constants/validators";
import { toast } from "react-hot-toast";

const MIN_STAKE = 0.001; // SOL

// Cache for RPC responses
const cache = {
  voteAccounts: null,
  voteAccountsTimestamp: 0,
  fees: null,
  feesTimestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

const getSolscanLink = (signature) => {
  // testnet
  // return `https://solscan.io/tx/${signature}?cluster=testnet`;
  // for main net
  return `https://solscan.io/tx/${signature}/`;
};

// Add retry utility with exponential backoff and proper delays
const withRetry = async (fn, initialDelay = 12000, maxRetries = 3) => {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.toString().includes("429") && retries < maxRetries - 1) {
        console.log(`Rate limited. Retrying after ${delay/1000}s delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retries++;
        continue;
      }
      throw error;
    }
  }
};

// Sequential request helper
const sequentialRequests = async (requests) => {
  const results = [];
  for (const request of requests) {
    // Add a small delay between requests
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    results.push(await request());
  }
  return results;
};

const getVoteAccounts = async (connection) => {
  const now = Date.now();
  if (cache.voteAccounts && (now - cache.voteAccountsTimestamp) < cache.CACHE_DURATION) {
    return cache.voteAccounts;
  }
  
  const voteAccounts = await withRetry(() => connection.getVoteAccounts());
  cache.voteAccounts = voteAccounts;
  cache.voteAccountsTimestamp = now;
  return voteAccounts;
};

const estimateStakeFees = async (connection) => {
  const now = Date.now();
  if (cache.fees && (now - cache.feesTimestamp) < cache.CACHE_DURATION) {
    return cache.fees;
  }

  const [rentExemption, recentBlockhash] = await sequentialRequests([
    () => withRetry(() => connection.getMinimumBalanceForRentExemption(StakeProgram.space)),
    () => withRetry(() => connection.getLatestBlockhash()),
  ]);
  
  const fees = {
    rentExemption: rentExemption / LAMPORTS_PER_SOL,
    txFee: recentBlockhash.feeCalculator?.lamportsPerSignature 
      ? (recentBlockhash.feeCalculator.lamportsPerSignature * 2) / LAMPORTS_PER_SOL
      : 0.000005
  };

  cache.fees = fees;
  cache.feesTimestamp = now;
  return fees;
};

const estimateUnstakeWithdrawFee = async (connection) => {
  const { feeCalculator } = await withRetry(() => connection.getLatestBlockhash());
  return feeCalculator?.lamportsPerSignature 
    ? feeCalculator.lamportsPerSignature / LAMPORTS_PER_SOL
    : 0.000005;
};

export default function StakingInterface() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [stakeType, setStakeType] = useState("native");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  // for main net
  const [validatorVotePubkey] = useState(MAINNET_VALIDATOR_VOTE);

  // for testnet
  // const [validatorVotePubkey] = useState(TESTNET_VALIDATOR_VOTE);
  const [validatorInfo, setValidatorInfo] = useState(null);
  const [activeStakes, setActiveStakes] = useState([]);
  const [showManageStake, setShowManageStake] = useState(false);
  const [unstakingAccount, setUnstakingAccount] = useState(null);
  const [withdrawingAccount, setWithdrawingAccount] = useState(null);

  // Add new state for fees
  const [stakingFees, setStakingFees] = useState({ rentExemption: 0.002, txFee: 0.000005 });
  const [unstakeFee, setUnstakeFee] = useState(0.000005);

  // Update balance fetching to use retry logic
  useEffect(() => {
    async function getBalance() {
      if (!publicKey) {
        setBalance(0);
        return;
      }

      try {
        const bal = await withRetry(() => connection.getBalance(publicKey));
        setBalance((bal / LAMPORTS_PER_SOL).toFixed(5));
      } catch (error) {
        console.error("Error fetching balance:", error);
        // Don't set balance to 0 on error, keep previous value
      }
    }

    getBalance();
    
    let intervalId;
    if (publicKey) {
      // Increase interval to 2 minutes
      intervalId = setInterval(getBalance, 120000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [publicKey, connection]);

  // Update stake accounts fetching to use sequential requests
  const fetchStakeAccounts = useCallback(async () => {
    if (!publicKey || !connection) return;

    try {
      // Get vote accounts first since they're cached
      const voteAccounts = await getVoteAccounts(connection);
      
      // Then fetch other data sequentially
      const [accounts, epochInfo] = await sequentialRequests([
        () => withRetry(() => connection.getParsedProgramAccounts(
          StakeProgram.programId,
          {
            filters: [
              {
                memcmp: {
                  offset: 44,
                  bytes: publicKey.toBase58(),
                },
              },
            ],
          }
        )),
        () => withRetry(() => connection.getEpochInfo()),
      ]);

      // Update validator info from cached vote accounts
      const validator = voteAccounts.current.find(
        (v) => v.nodePubkey === MAINNET_VALIDATOR_ID.toString()
      );

      if (validator) {
        setValidatorInfo({
          commission: validator.commission,
          activatedStake: validator.activatedStake / LAMPORTS_PER_SOL,
          epochCredits: validator.epochCredits,
        });
      }

      const stakeAccountsInfo = accounts.map((account) => {
        const stakeAccount = account.account;
        const stakeState = stakeAccount.data.parsed.type;
        const delegation = stakeAccount.data.parsed.info.stake?.delegation;
        const delegatedVoteAccount = delegation?.voter;
        
        let validatorName = "Unknown Validator";
        if (delegatedVoteAccount) {
          const validator = voteAccounts.current.find(
            (v) => v.votePubkey === delegatedVoteAccount
          );
          if (validator) {
            validatorName = validator.nodePubkey.slice(0, 8) + "...";
          }
        }

        // Determine the actual state based on delegation and epochs
        let actualState = stakeState;
        if (stakeState === "delegated" && delegation) {
          if (delegation.deactivationEpoch !== "18446744073709551615") {
            if (epochInfo.epoch >= delegation.deactivationEpoch) {
              actualState = "inactive";
            } else {
              actualState = "deactivating";
            }
          }
        }

        return {
          pubkey: account.pubkey,
          lamports: stakeAccount.lamports,
          state: actualState,
          delegatedVoteAccount,
          validatorName,
          activation: delegation?.activationEpoch,
          deactivation: delegation?.deactivationEpoch,
          currentEpoch: epochInfo.epoch,
        };
      });

      setActiveStakes(stakeAccountsInfo);
    } catch (error) {
      console.error("Error fetching stake accounts:", error);
      toast.error("Failed to fetch stake accounts");
    }
  }, [publicKey, connection]);

  // Update polling intervals
  useEffect(() => {
    if (publicKey) {
      fetchStakeAccounts();
      // Increase interval to 2 minutes
      const intervalId = setInterval(fetchStakeAccounts, 120000);
      return () => clearInterval(intervalId);
    }
  }, [publicKey, fetchStakeAccounts]);

  // Update fee fetching to use longer interval
  useEffect(() => {
    if (connection) {
      let isSubscribed = true;
      
      const updateFees = async () => {
        try {
          const [stakeFees, unstakeWithdrawFee] = await sequentialRequests([
            () => estimateStakeFees(connection),
            () => estimateUnstakeWithdrawFee(connection)
          ]);
          
          if (isSubscribed) {
            setStakingFees(stakeFees);
            setUnstakeFee(unstakeWithdrawFee);
          }
        } catch (error) {
          console.error("Failed to update fees:", error);
        }
      };
      
      updateFees();
      // Update fees every 15 minutes
      const intervalId = setInterval(updateFees, 900000);
      
      return () => {
        isSubscribed = false;
        clearInterval(intervalId);
      };
    }
  }, [connection]);

  const handleUnstake = useCallback(async (stakePubkey) => {
    if (!publicKey || !connection || !signTransaction) return;

    try {
      setUnstakingAccount(stakePubkey);
      const transaction = new Transaction();
      
      const deactivateIx = StakeProgram.deactivate({
        stakePubkey: new PublicKey(stakePubkey),
        authorizedPubkey: publicKey,
      });

      transaction.add(deactivateIx);
      
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);

      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      toast.success(
        <div>
          Unstaking initiated! View on{" "}
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
        }
      );

      // Refresh stake accounts after unstaking
      await fetchStakeAccounts();
    } catch (error) {
      console.error("Error unstaking:", error);
      toast.error("Failed to unstake. Please try again.");
    } finally {
      setUnstakingAccount(null);
    }
  }, [publicKey, connection, signTransaction]);

  const handleWithdraw = useCallback(async (stakePubkey) => {
    if (!publicKey || !connection || !signTransaction) return;

    try {
      setWithdrawingAccount(stakePubkey);
      const transaction = new Transaction();
      
      // Get the stake account balance
      const stakeAccount = await connection.getAccountInfo(new PublicKey(stakePubkey));
      if (!stakeAccount) {
        throw new Error("Stake account not found");
      }

      const withdrawInstruction = StakeProgram.withdraw({
        stakePubkey: new PublicKey(stakePubkey),
        authorizedPubkey: publicKey,
        toPubkey: publicKey,
        lamports: stakeAccount.lamports, // Withdraw entire balance
      });

      transaction.add(withdrawInstruction);
      
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      toast.success(
        <div>
          Withdrawal initiated! View on{" "}
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
        }
      );

      // Refresh stake accounts after withdrawal
      await fetchStakeAccounts();
    } catch (error) {
      console.error("Error withdrawing stake:", error);
      toast.error("Failed to withdraw. Please try again.");
    } finally {
      setWithdrawingAccount(null);
    }
  }, [publicKey, connection, signTransaction]);

  const renderStakeAccounts = () => {
    if (!activeStakes.length) {
      return (
        <div className="text-center text-gray-400 py-4">
          No active stakes found
        </div>
      );
    }

    return activeStakes.map((stake) => {
      let actionButton = null;
      let remainingTime = "";

      if (stake.state === "delegated") {
        actionButton = (
          <button
            className="px-4 py-2 rounded bg-red-500 hover:bg-red-600"
            onClick={() => handleUnstake(stake.pubkey)}
            disabled={unstakingAccount === stake.pubkey}
          >
            {unstakingAccount === stake.pubkey ? "Unstaking..." : "Unstake"}
          </button>
        );
      } else if (stake.state === "deactivating") {
        const remainingEpochs = Math.max(0, stake.deactivation - stake.currentEpoch);
        const estimatedDays = remainingEpochs * 2.5;
        remainingTime = `~${Math.ceil(estimatedDays)} days remaining`;
        
        actionButton = (
          <div className="px-4 py-2 rounded bg-yellow-600 text-sm text-center">
            Deactivating
            <div className="text-xs mt-1">{remainingTime}</div>
          </div>
        );
      } else if (stake.state === "inactive") {
        actionButton = (
          <button
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-sm"
            onClick={() => handleWithdraw(stake.pubkey)}
            disabled={withdrawingAccount === stake.pubkey}
          >
            {withdrawingAccount === stake.pubkey ? (
              "Withdrawing..."
            ) : (
              "Withdraw Stake"
            )}
          </button>
        );
      } else {
        actionButton = (
          <button
            className="px-4 py-2 rounded bg-gray-600 cursor-not-allowed"
            disabled
          >
            Unavailable
          </button>
        );
      }

      return (
        <div
          key={stake.pubkey}
          className="bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Validator:</span>
              <span className="text-sm text-gray-300">{stake.validatorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Amount:</span>
              <span className="text-sm text-gray-300">
                {(stake.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-sm ${
                stake.state === "delegated" ? "text-green-400" :
                stake.state === "deactivating" ? "text-yellow-400" :
                stake.state === "inactive" ? "text-blue-400" :
                "text-gray-300"
              }`}>
                {stake.state}
              </span>
            </div>
          </div>
          {actionButton}
        </div>
      );
    });
  };

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
      connection
        .sendRawTransaction(signedTx.serialize())
        .then((signature) => {
          console.log("Staking transaction signature:", signature);

          toast.success(
            <div>
              Transaction sent! View on{" "}
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
                minWidth: "300px",
              },
            }
          );
        })
        .catch((error) => {
          console.error("Error sending transaction:", error);
          toast.error("Failed to send transaction. Please try again.", {
            duration: 10000,
          });
        });

      return signedTx;
    } catch (error) {
      console.error("Error staking SOL:", error);
      toast.error("Error staking SOL, check block explorer.");
    } finally {
      setLoading(false);
    }
  }, [publicKey, amount, validatorVotePubkey, connection, signTransaction]);

  return (
    <div className="bg-[#191a2c] text-white p-6 rounded-lg max-w-md mx-auto">
      <div className="flex justify-between mb-4">
        <button
          className={`p-2 relative ${!showManageStake ? "underline-glow" : ""}`}
          onClick={() => setShowManageStake(false)}
        >
          Stake
        </button>
        <button
          className={`p-2 relative ${showManageStake ? "underline-glow" : ""}`}
          onClick={() => setShowManageStake(true)}
        >
          Manage Stakes
        </button>
      </div>

      {showManageStake ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Active Stakes</h2>
          {renderStakeAccounts()}
        </div>
      ) : (
        <>
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
                    const maxAmount = balance - stakingFees.rentExemption - stakingFees.txFee;
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
              <p className="text-sm truncate" title={MAINNET_VALIDATOR_ID.toString()}>
                {MAINNET_VALIDATOR_ID.toString().slice(0, 8)}...
              </p>
              {/* for testnet */}
              {/* <p className="text-sm truncate" title={TESTNET_VALIDATOR.toString()}>
                {TESTNET_VALIDATOR.toString().slice(0, 8)}...
              </p> */}
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
                : balance < (stakingFees.rentExemption + stakingFees.txFee + MIN_STAKE) ||
                  (amount && parseFloat(amount) < MIN_STAKE)
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
              balance < (stakingFees.rentExemption + stakingFees.txFee + MIN_STAKE) ||
              loading
            }
          >
            {loading ? (
              "Staking..."
            ) : balance < (stakingFees.rentExemption + stakingFees.txFee + MIN_STAKE) ? (
              <>
                <div>Minimum stake amount is {MIN_STAKE} SOL</div>
                <div>Minimum balance needed to stake is {stakingFees.rentExemption + stakingFees.txFee + MIN_STAKE} SOL</div>
              </>
            ) : parseFloat(amount) < MIN_STAKE ? (
              <div>Minimum stake amount is {MIN_STAKE} SOL</div>
            ) : (
              "Stake SOL"
            )}
          </button>
        </>
      )}
    </div>
  );
}
