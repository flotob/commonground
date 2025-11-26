// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Button from "components/atoms/Button/Button";
import CheckboxBase from "components/atoms/CheckboxBase/CheckboxBase";
import ScreenAwareModal from "components/atoms/ScreenAwareModal/ScreenAwareModal";
import SimpleLink from "components/atoms/SimpleLink/SimpleLink";
import { useWindowSizeContext } from "context/WindowSizeProvider";
import React, { useState } from "react";

type Props = {};

const MAX_ETH = 5;
const TOKEN_RATE = 1000;

const BuyTokenHeader: React.FC<Props> = (props) => {
  const { isMobile } = useWindowSizeContext();
  const [ethAmount, setEthAmount] = useState<string>('');
  const [ethAmountNumber, setEthAmountNumber] = useState<number | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEthAmount(e.target.value);
    const numValue = parseFloat(e.target.value);
    if (isNaN(numValue)) {
      setEthAmountNumber(null);
    } else {
      setEthAmountNumber(numValue);
    }
  };

  const handlePurchase = () => {
    if (ethAmountNumber && ethAmountNumber > 0 && ethAmountNumber <= MAX_ETH) {
      // onPurchase(ethAmount);
      setIsProcessing(true);
      new Promise((resolve) => setTimeout(resolve, 5000)).then(() => {
        setIsProcessing(false);
      });
    }
  };

  const tokensToReceive = (ethAmountNumber || 0) * TOKEN_RATE;

  if (isProcessing) {
    return <div className="w-full bg-gradient-to-r from-[var(--surface-brand)] via-[var(--surface-brand-secondary)] to-[var(--surface-brand-dark)] p-8 rounded-xl shadow-lg flex flex-col items-center">
      <h2 className="text-white">Processing your purchase...</h2>
    </div>
  }

  return (<>
    <div className="w-full bg-gradient-to-r from-[var(--surface-brand)] via-[var(--surface-brand-secondary)] to-[var(--surface-brand-dark)] p-8 rounded-xl shadow-lg flex flex-col items-center">
      <h1 className="text-3xl font-bold text-white mb-2" id="buy-tokens">
        Buy $CG token now
      </h1>
      <p className="text-white text-lg mb-4">
        You can buy at most <span className="font-semibold">{MAX_ETH} ETH</span>
      </p>
      <div className="flex flex-col md:flex-row items-center gap-4 mb-4 w-full max-w-lg">
        <input
          value={ethAmount}
          onChange={handleInputChange}
          className="w-full md:flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--surface-brand)]"
          placeholder={`Enter ETH amount (max ${MAX_ETH})`}
        />
        <button
          className={`
            w-full md:w-auto
            px-6 py-2 cursor-pointer bg-white font-semibold rounded-lg shadow hover:bg-indigo-100 transition
            ${!ethAmountNumber || ethAmountNumber <= 0 || ethAmountNumber > MAX_ETH ? "opacity-50 cursor-not-allowed" : ""}
          `}
          style={{ color: "var(--surface-brand-dark)" }}
          onClick={() => setConfirmModalOpen(true)}
          disabled={!ethAmountNumber || ethAmountNumber <= 0 || ethAmountNumber > MAX_ETH}
        >
          Purchase
        </button>
      </div>
      {(!ethAmountNumber || ethAmountNumber === 0) && (
        <div className="text-white mb-2">
          Enter an ETH amount to see how many $CG tokens you will receive.
        </div>
      )}
      {!!ethAmountNumber && ethAmountNumber < MAX_ETH && (<div className="text-white mb-2">
        By buying <span className="font-semibold">{ethAmountNumber || "X"}</span> ETH you will get{" "}
        <span className="font-semibold">{ethAmountNumber > 0 ? tokensToReceive : "Y"}</span> $CG tokens
      </div>)}
      {!!ethAmountNumber && ethAmountNumber > MAX_ETH && (<>
        <div className="text-white mb-2">
          You are buying more than the max {MAX_ETH} allowed for this sale.
        </div>
        <div className="text-white opacity-80 mt-2">
          Want to invest more than {MAX_ETH} ETH? <SimpleLink className="underline" href="app.cg">Reach out to us.</SimpleLink>
        </div>
      </>)}
    </div>
    <ScreenAwareModal
      isOpen={confirmModalOpen}
      onClose={() => setConfirmModalOpen(false)}
      hideHeader
    >
      <div className={`flex flex-col gap-6 cg-text-main${isMobile ? 'px-4 pt-4 pb-16' : ''}`}>
        <h3>You need to accept the terms before continuing.</h3>
        <div>
          <a
            className="underline p-4 cg-bg-subtle cg-border-l cg-text-brand"
            href="/terms.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the Terms & Conditions (PDF)
          </a>
        </div>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAcceptTerms(!acceptTerms)}>
          <CheckboxBase
            type="checkbox"
            size="normal"
            checked={acceptTerms}
          />
          <span>
            I have read and accept the Terms & Conditions
          </span>
        </div>
        <div className="flex justify-end gap-4">
          <Button
            role='secondary'
            text='Cancel'
            onClick={() => setConfirmModalOpen(false)}
          />
          <Button
            role="primary"
            disabled={!acceptTerms}
            onClick={() => {
              // Continue logic here
              setConfirmModalOpen(false);
              handlePurchase();
            }}
            text='Continue'
          />
        </div>
      </div>
    </ScreenAwareModal>
  </>);
};

export default BuyTokenHeader;