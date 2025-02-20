import { PublicKey } from "@solana/web3.js";

export const VALIDATOR_ADDRESSES = {
  MAINNET: new PublicKey("Ha1iade1AH3B12K9SccfWoPdFtQKKQsj2ZyWwxcjqJJU"),
  TESTNET: new PublicKey("Ha1CoNmAcbCQbg9QcCjLH79gLCqVZdxABwccQH3xexXE"),
  MAINNET_VOTE_ACCOUNT: new PublicKey("Ha1VoTEPWFQp1wZjbQhBNXJftuHvimu1ruzF3xKYRPDQ")
};

export const DEFAULT_VALIDATOR = VALIDATOR_ADDRESSES.MAINNET;
export const DEFAULT_VALIDATOR_VOTE = VALIDATOR_ADDRESSES.MAINNET_VOTE_ACCOUNT;
