// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from "react";
import { useOwnUser } from "./OwnDataProvider";
import CaptchaModal from "components/molecules/CaptchaModal/CaptchaModal";

type CaptchaContextState = {
  captchaVisible: boolean;
};

export const CaptchaContext = React.createContext<CaptchaContextState>({
  captchaVisible: false,
});

export function CaptchaContextProvider(props: React.PropsWithChildren<{}>) {
  const ownUser = useOwnUser();
  const captchaVisible = ownUser ? parseFloat(ownUser.trustScore) < 1 : false;

  return (
    <CaptchaContext.Provider value={{ captchaVisible }}>
      {captchaVisible && <CaptchaModal />}
      {props.children}
    </CaptchaContext.Provider>
  )
}

export function useCaptchaContext() {
  const context = React.useContext(CaptchaContext);
  return context;
}