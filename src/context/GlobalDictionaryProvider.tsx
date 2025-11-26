// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from "react";

type GlobalDictionaryState = {
  dict: Record<string, any>
  setEntry: (name: string, value: any) => void; 
};

export const GlobalDictionaryContext = React.createContext<GlobalDictionaryState>({
  dict: {},
  setEntry: () => undefined
});

export function GlobalDictionaryProvider(props: React.PropsWithChildren<{}>) {
  const [ dict, setDict ] = useState<Record<string, any>>({});

  const setEntry = React.useCallback((name: string, value: any) => {
    setDict(old => ({
      ...old,
      [name]: value
    }));
  }, []);

  return (
    <GlobalDictionaryContext.Provider value={{dict, setEntry}}>
      {props.children}
    </GlobalDictionaryContext.Provider>
  )
}

export function useGlobalDictionaryContext() {
  const context = React.useContext(GlobalDictionaryContext);
  return context;
}