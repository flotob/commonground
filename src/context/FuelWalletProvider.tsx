// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Fuel } from 'fuels';
import userApi from "data/api/user";
import { useState, useEffect, useCallback } from "react";
import { defaultConnectors } from '@fuels/connectors';

const fuel = new Fuel({
  connectors: defaultConnectors({ devMode: true }),
});

export function useFuel() {
  const [fuelError, setError] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | undefined>(undefined);
  const hasFuelet = !!(window as any).fuelet;

  useEffect(() => {
    if (!fuel) {
      // setError("Fuel Wallet not detected on device");
      setLoading(false);
    } else {
      fuel.hasWallet().then((hasWallet) => {
        if (hasWallet) {
          setError("");
          setHasWallet(true);
        } else {
          // setError("Fuel Wallet not detected on device");
        }
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    async function handleConnection() {
      if (!fuel) {
        setIsConnected(false);
      } else {
        const isConnected = await fuel.isConnected();
        setIsConnected(isConnected);
      }
    }

    handleConnection();

    fuel?.on(fuel.events.connection, handleConnection);
    return () => {
      fuel?.off(fuel.events.connection, handleConnection);
    };
  }, []);

  useEffect(() => {
    const getAddress = async () => {
      if (isConnected) {
        const currentAccount = await fuel.currentAccount();
        if (currentAccount) {
          setAccount(currentAccount);
        }
      }
    };
    getAddress();
    fuel.on(fuel.events.currentAccount, getAddress);
    return () => {
      fuel.off(fuel.events.currentAccount, getAddress);
    };
  }, [isConnected]);

  const connectToFuel = useCallback(async () => {
    if (!fuelError) {
      await fuel.selectConnector('Fuel Wallet');
      await fuel.connect();
    } else {
      setError(fuelError);
    }
  }, [fuelError]);

  
  const handleSignMessage = useCallback(
    async (message: string) => {
      if (!isConnected) await connectToFuel();
      if (!account) {
        setError("No account found");
        return;
      }
      const wallet = await fuel?.getWallet(account);
      const signedMessage = await wallet?.signMessage(message);
      return signedMessage;
    },
    [account, connectToFuel, isConnected]
  );

  const linkCurrentWallet = useCallback(async () => {
    if (!!account) {
      try {
        const secret = await userApi.getSignableSecret();
        const data: API.User.SignableWalletData = {
          address: account.toLowerCase() as Common.FuelAddress,
          secret,
          type: "fuel",
        };
        let signedMessage;
        try {
          signedMessage = await handleSignMessage(secret);
        } catch (e) {
          console.log("Error signing message:", fuelError);
          return;
        }
        if (signedMessage === undefined) return;
        setError("");
        return { data, signature: signedMessage };
      } catch (e) {
        let message = (e as unknown as any).toString();
        if (message) {
          // remove useless prefix
          message = message.replace("Error:", "");
        }
        setError(message);
      }
    }
  }, [account, fuelError, handleSignMessage]);

  return {
    hasWallet,
    fuelError,
    isLoading,
    isConnected,
    handleSignMessage,
    connectToFuel,
    account,
    linkCurrentWallet,
    hasFuelet,
  };
}
