// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ethers } from "ethers";
import errors from "common/errors";
import userApi from "data/api/user";
import getSiweMessage from "util/siwe";

type UniversalProfileContextType = {
  universalProfileAddress: string | undefined;
  isConnected: boolean;
  hasExtension: boolean;
  isLoading: boolean;
  error: string | undefined;
  setError: React.Dispatch<React.SetStateAction<string | undefined>>;
  confirmOwnership: () => Promise<LoginData | undefined>;
  connectToUniversalProfile: () => void;
};

interface LoginData {
  address: string;
  signature: string;
  message: string;
}

declare global {
  interface Window {
    lukso: any;
  }
}

// Create a new context for the universal profile
export const UniversalProfileContext =
  createContext<UniversalProfileContextType>({
    universalProfileAddress: undefined,
    isConnected: false,
    hasExtension: false,
    isLoading: false,
    error: undefined,
    setError: () => {},
    confirmOwnership: () => Promise.resolve(undefined),
    connectToUniversalProfile: () => {},
  });

export const useUniversalProfile = () => useContext(UniversalProfileContext);

// Define the provider component
export const UniversalProfileProvider: React.FC<
  React.PropsWithChildren<{}>
> = ({ children }) => {
  const [etherProvider, setEtherProvider] = useState<
    ethers.providers.Web3Provider | undefined
  >(undefined);
  // Initialize the profile state with null
  const [universalProfileAddress, setAddress] = useState<string | undefined>(
    undefined
  );
  const [hasExtension, setHasExtension] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (window.lukso) {
      setEtherProvider(new ethers.providers.Web3Provider(window.lukso));
      setHasExtension(true);
    } else {
      setHasExtension(false);
    }
  }, []);

  const connectToUniversalProfile = async () => {
    try {
      if (!etherProvider) {
        throw new Error("No ether provider found");
      }
      setLoading(true);
      if (etherProvider.network.chainId !== 42) {
        const hexChainID = ethers.utils.hexlify(42);
        try {
          await etherProvider.send("wallet_switchEthereumChain", [
            {
              chainId: hexChainID,
            },
          ]);
        } catch (error: any) {
          setError(error.message);
          return;
        }
      }
      await etherProvider.send("eth_requestAccounts", []);
      const signer = etherProvider.getSigner();
      try {
        const upAddress = await signer.getAddress();
        if (upAddress) {
          setAddress(upAddress);
          setLoading(false);
          setIsConnected(true);
        } else {
          setLoading(false);
          setIsConnected(false);
        }
      } catch (e: any) {
        setLoading(false);
        setIsConnected(false);
        setError(e.message);
      }
    } catch (error: any) {
      setLoading(false);
      setError(error.message);
    }
  };

  const signWithUniversalProfile = useCallback(async () => {
    if (!etherProvider) {
      throw new Error("No ether provider found");
    }
    if (!universalProfileAddress) {
      throw new Error("No universal profile address found");
    }
    const secret = await userApi.getSignableSecret();
    let siweMessage = getSiweMessage({ address: universalProfileAddress as Common.Address, chainId: 42, secret });

    const signature = await etherProvider.send("eth_sign", [
      universalProfileAddress,
      siweMessage,
    ]);
    return { signature, siweMessage, secret };
  }, [universalProfileAddress, etherProvider]);

  const confirmOwnership = useCallback(async () => {
    setLoading(true);
    if (!!universalProfileAddress) {
      try {
        const universalProfileSignature = await signWithUniversalProfile();

        if (universalProfileSignature) {
          setError(undefined);
          const luksoLoginData: LoginData = {
            address: universalProfileAddress,
            signature: universalProfileSignature.signature,
            message: universalProfileSignature.siweMessage,
          };
          setLoading(false);
          return luksoLoginData;
        } else {
          setLoading(false);
          throw new Error("Could not sign wallet, please try again");
        }
      } catch (e: any) {
        setLoading(false);
        if (e.code === 4001) {
          setError("You rejected the sign request");
        } else {
          if (e.message) {
            let message: string = e.message.toString();
            if (message) {
              // remove useless prefix
              message = message.replace("Error:", "");
            }
            if (message.includes(errors.server.LUKSO_USERNAME_NOT_FOUND)) {
              message = "No universal profile username found for that address";
            }
            setError(message);
          } else {
            setError(e);
          }
        }
      }
    } else {
      setLoading(false);
      setError("No universal profile address found");
      throw new Error("No universal profile address found");
    }
  }, [universalProfileAddress, signWithUniversalProfile]);

  return (
    <UniversalProfileContext.Provider
      value={{
        universalProfileAddress,
        hasExtension,
        isLoading,
        isConnected,
        error,
        setError,
        confirmOwnership,
        connectToUniversalProfile,
      }}
    >
      {children}
    </UniversalProfileContext.Provider>
  );
};
