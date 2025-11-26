// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "common/config";
import Snackbar, { Props } from "components/atoms/Snackbar/Snackbar";
import React, { useCallback, useState } from "react";

type SnackbarProps = Props & { timestamp: number };

type SnackbarContextState = {
  showSnackbar: (props: Props) => void;
};

export const SnackbarContext = React.createContext<SnackbarContextState>({
  showSnackbar: () => {}
});

export function SnackbarContextProvider(props: React.PropsWithChildren<{}>) {
  const [snackbars, setSnackbars] = useState<SnackbarProps[]>([]);

  const showSnackbar = useCallback((props: Props) => {
    const insertTime = new Date().getTime();
    setSnackbars(old => [...old, {...props, timestamp: insertTime }]);

    // Remove old snackbars
    setTimeout(() => {
      setSnackbars(old => old.filter(snackbar => snackbar.timestamp !== insertTime));
    }, ((props.durationSeconds || config.SNACKBAR_DURATION) + 1) * 1000);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {props.children}
      {snackbars.map(snackbar => <Snackbar {...snackbar} key={snackbar.timestamp} />)}
    </SnackbarContext.Provider>
  )
}

export function useSnackbarContext() {
  const context = React.useContext(SnackbarContext);
  return context;
}