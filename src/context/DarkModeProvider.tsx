// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useEffect } from "react";
import useLocalStorage from "hooks/useLocalStorage";

type DarkModeConfig = 'auto' | 'light' | 'dark';

type DarkModeState = {
  isDarkMode: boolean;
  darkModeConfig: DarkModeConfig;
  setDarkModeConfig: (darkMode: DarkModeConfig) => void;
}

export const DarkModeContext = React.createContext<DarkModeState>({ isDarkMode: false, darkModeConfig: 'auto', setDarkModeConfig: () => { } });

export function DarkModeProvider(props: React.PropsWithChildren<{}>) {
  const [darkModeConfig, setDarkModeConfig] = useLocalStorage<DarkModeConfig>('auto', 'dark-mode');

  let isDarkMode = false;
  if (darkModeConfig === 'auto') isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (darkModeConfig === 'dark') isDarkMode = true;

  useEffect(() => {
    if (isDarkMode) {
      document.body.className = 'dark';
      document.documentElement.classList.add('cg-initial-dark-mode');
    }
    else {
      document.body.className = 'light';
      document.documentElement.classList.remove('cg-initial-dark-mode');
    }
  }, [isDarkMode]);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, darkModeConfig, setDarkModeConfig }}>
      {props.children}
    </DarkModeContext.Provider>
  )
}

export function useDarkModeContext() {
  const context = React.useContext(DarkModeContext);
  return context;
}