// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { createContext, useCallback, useContext, useState } from "react";
import sumsubApi from "../data/api/sumsub";

interface SumsubContextData {
  accessToken?: string;
  accessTokenExpirationHandler: () => Promise<string>;
  fetchAccessToken: (type: API.Sumsub.KycType) => Promise<void>;
}

const SumsubContext = createContext<SumsubContextData | undefined>(undefined);

export const useSumsubContext = (): SumsubContextData => {
  const context = useContext(SumsubContext);
  if (!context) {
    throw new Error(
      "useSumsubContext must be used within a SumsubContextProvider"
    );
  }
  return context;
};

export const SumsubContextProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string>("");
  const [kycType, setKycType] = useState<API.Sumsub.KycType | undefined>(
    undefined
  );

  const accessTokenExpirationHandler = useCallback(async () => {
    try {
      if (!kycType) {
        throw new Error("KYC type is not set");
      }
      const newToken = await sumsubApi.getAccessToken({type: kycType});
      setAccessToken(newToken.accessToken);
      return newToken.accessToken;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      throw error;
    }
  }, [kycType]);

  const fetchAccessToken = useCallback(async (type: API.Sumsub.KycType) => {
    try {
      setKycType(type);
      const token = await sumsubApi.getAccessToken({type});
      setAccessToken(token.accessToken);
    } catch (error) {
      console.error("Failed to fetch access token:", error);
    }
  }, []);

  return (
    <SumsubContext.Provider
      value={{
        accessToken,
        accessTokenExpirationHandler,
        fetchAccessToken,
      }}
    >
      {children}
    </SumsubContext.Provider>
  );
};
