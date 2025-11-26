// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import userApi from "data/api/user";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  walletDetector,
  BrowserWindowMessageConnection,
  AeSdkAepp,
  Node,
  encode,
  Encoding,
} from "@aeternity/aepp-sdk";

const TESTNET_NODE_URL = "https://testnet.aeternity.io";
const MAINNET_NODE_URL = "https://mainnet.aeternity.io";

type AeternityWalletContextType = {
  address: string | undefined;
  isConnected: boolean;
  hasWallet: boolean;
  isLoading: boolean;
  linkCurrentWallet: () => Promise<
    { data: API.User.SignableWalletData; signature: string } | undefined
  >;
  connectToWallet: () => void;
};

const AeternityWalletContext = createContext<AeternityWalletContextType>({
  hasWallet: false,
  isConnected: false,
  isLoading: false,
  address: "",
  linkCurrentWallet: () => {
    return Promise.resolve(undefined);
  },
  connectToWallet: () => {},
});

export const useAeternityWallet = () => useContext(AeternityWalletContext);

const AeternityWalletProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [networkId, setNetworkId] = useState<string | undefined>(undefined);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [hasWallet, setHasWallet] = useState(false);
  const [isConnecting, setConnecting] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const aeSdk = useMemo(
    () =>
      new AeSdkAepp({
        name: "Commonground",
        nodes: [
          { name: "testnet", instance: new Node(TESTNET_NODE_URL) },
          { name: "mainnet", instance: new Node(MAINNET_NODE_URL) },
        ],
        onNetworkChange: async ({ networkId }) => {
          const [{ name }] = (await aeSdk.getNodesInPool()).filter(
            (node) => node.nodeNetworkId === networkId
          );
          aeSdk.selectNode(name);
          setNetworkId(networkId);
        },
        onAddressChange: ({ current }) => setAddress(Object.keys(current)[0]),
        onDisconnect: () => console.warn("Aepp is disconnected"),
      }),
    []
  );

  useEffect(() => {
    const scanForWallets = async () => {
      setLoading(true);
      return new Promise<string>((resolve) => {
        const handleWallets = async ({
          wallets,
          newWallet,
        }: {
          wallets: { [key: string]: any };
          newWallet?: any;
        }) => {
          newWallet = newWallet || Object.values(wallets)[0];
          if (newWallet.info.name) {
            stopScan();
            setLoading(false);
            setHasWallet(true);
          } else {
            setLoading(false);
            setHasWallet(false);
          }
        };
        const scannerConnection = new BrowserWindowMessageConnection();
        const stopScan = walletDetector(scannerConnection, handleWallets);
      });
    };

    scanForWallets();
  }, []);

  const connectToWallet = useCallback(async () => {
    const connectWallet = async () => {
      setConnecting(true);
      const handleWallets = async ({
        wallets,
        newWallet,
      }: {
        wallets: { [key: string]: any };
        newWallet?: any;
      }) => {
        newWallet = newWallet || Object.values(wallets)[0];
        if (newWallet.info.name) {
          stopScan();
          const getWalletInfo = await aeSdk.connectToWallet(
            newWallet.getConnection()
          );
          if (!getWalletInfo) throw new Error("Could not connect to wallet");
          const {
            address: { current },
          } = await aeSdk.subscribeAddress("subscribe" as any, "connected");
          setAddress(Object.keys(current)[0]);
          setIsConnected(true);
        }
      };

      const scannerConnection = new BrowserWindowMessageConnection();
      const stopScan = walletDetector(scannerConnection, handleWallets);
    };
    connectWallet();
    setConnecting(false);
  }, [aeSdk]);

  const handleSignMessage = useCallback(
    async (message: string) => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }
      if (!networkId) {
        throw new Error("Network not connected");
      }

      return await aeSdk.signMessage(message).then((result) => {
        const encodedSignature = encode(result, Encoding.Signature);
        return encodedSignature;
      });
    },
    [aeSdk, isConnected, networkId]
  );

  const linkCurrentWallet = useCallback(async () => {
    if (!!address) {
      try {
        const secret = await userApi.getSignableSecret();
        const data: API.User.SignableWalletData = {
          address: address as Common.AeternityAddress,
          secret,
          type: "aeternity",
        };
        let signedMessage: string;
        try {
          signedMessage = await handleSignMessage(secret);
        } catch (e: any) {
          throw new Error("Error signing message:" + e.message);
        }
        if (signedMessage === undefined) return;
        return { data, signature: signedMessage };
      } catch (e) {
        let message = (e as unknown as any).toString();
        if (message) {
          // remove useless prefix
          message = message.replace("Error:", "");
        }
        throw new Error(message);
      }
    }
  }, [address, handleSignMessage]);

  return (
    <AeternityWalletContext.Provider
      value={{
        address,
        isConnected,
        connectToWallet,
        hasWallet,
        isLoading,
        linkCurrentWallet,
      }}
    >
      {children}
    </AeternityWalletContext.Provider>
  );
};

export default AeternityWalletProvider;
