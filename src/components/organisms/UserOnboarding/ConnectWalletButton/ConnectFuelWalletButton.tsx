// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useMemo } from "react";
import "./ConnectWalletButton.css";
import { XMarkIcon } from "@heroicons/react/24/solid";
import Button from "components/atoms/Button/Button";
import Tag from "components/atoms/Tag/Tag";
import { useFuel } from "context/FuelWalletProvider";
import { ReactComponent as FuelIcon } from '../../../atoms/icons/24/Fuel.svg';

import { useWindowSizeContext } from "context/WindowSizeProvider";

type Props = {
  walletData: API.User.prepareWalletAction.Request | undefined;
  setWalletData: React.Dispatch<React.SetStateAction<API.User.prepareWalletAction.Request | undefined>>;
};

const ConnectFuelWalletButton: React.FC<Props> = (props) => {
  const {
    fuelError,
    isLoading,
    hasWallet,
    isConnected,
    account,
    connectToFuel,
    linkCurrentWallet,
  } = useFuel();
  const { isMobile } = useWindowSizeContext();
  const { walletData, setWalletData } = props;

  const getSmallLabel = useCallback(() => {
    // return address in XXXX..XXXX format
    if (!account) return "";
    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  }, [account]);

  const notConnectedButton = useMemo(() => {
    if (!hasWallet) {
      return (
        <div className="flex flex-col gap-2">
          <Button
            role="chip"
            className="justify-between py-3 px-4"
            text="Connect Fuel wallet"
            iconRight={<FuelIcon className="w-5 h-5" />}
            disabled={true}
            loading={isLoading}
          />
          {fuelError && (
            <span className="error cg-text-md-400">{fuelError}</span>
          )}
        </div>
      );
    } else if (!isConnected) {
      return (
        <Button
          role="chip"
          className="justify-between py-3 px-4"
          text="Connect Fuel wallet"
          iconRight={<FuelIcon className="w-5 h-5" />}
          onClick={connectToFuel}
        />
      );
    }
  }, [connectToFuel, fuelError, hasWallet, isConnected, isLoading]);

  const SignButton = useMemo(() => {
    if (isConnected) {
      return (
        <div className="flex flex-col gap-2">
          <div className="connect-wallet-connected-container">
            <Tag variant="wallet" label={getSmallLabel()} />

            {!walletData && (
              <Button
                className="py-3 px-4"
                text="Please sign to activate"
                role="chip"
                onClick={async() => {
                  const walletData = await linkCurrentWallet();
                  if (walletData) {
                    setWalletData({ type: 'fuel', ...walletData });
                  }
                }}
              />
            )}
            {!!walletData && (
              <div className="flex items-center gap-4">
                <Tag variant="success" label="Active" />
                <XMarkIcon
                  className="w-6 h-6 cursor-pointer"
                  onClick={() => setWalletData(undefined)}
                />
              </div>
            )}
          </div>
          {fuelError && (
            <span className="error cg-text-md-400">{fuelError}</span>
          )}
          <span className="cg-text-secondary cg-text-md-400">
            Your wallet is not shown to others. You can change this in your
            settings.
          </span>
        </div>
      );
    }
  }, [
    getSmallLabel,
    isConnected,
    linkCurrentWallet,
    setWalletData,
    walletData,
    fuelError,
  ]);

  if (isMobile || !hasWallet) return null;

  return (
    <>
      {notConnectedButton}
      {SignButton}
    </>
  );
};

export default React.memo(ConnectFuelWalletButton);
