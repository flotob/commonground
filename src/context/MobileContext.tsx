// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useState } from "react";

type AudioTrayStatement = 'visible' | 'hidden';

type AudioTrayState = {
  audioTrayStatement: AudioTrayStatement;
  toggleAudioTrayStatement: () => void;
}

export const MobileContext = React.createContext<AudioTrayState>({
  audioTrayStatement: 'visible',
  toggleAudioTrayStatement: () => {}
});

export function MobileProvider(props: React.PropsWithChildren<{}>) {
  const [ audioTrayStatement, setAudioTrayStatement ] = useState<AudioTrayStatement>('visible');

  const toggleAudioTrayStatement = useCallback(()=> {
    setAudioTrayStatement(audioTrayStatement === 'visible' ? 'hidden' : 'visible');
  }, [audioTrayStatement, setAudioTrayStatement]);

  return (
    <MobileContext.Provider value={{ audioTrayStatement, toggleAudioTrayStatement }}>
      {props.children}
    </MobileContext.Provider>
  ); 
}

export function useMobileContext() {
  const context = React.useContext(MobileContext);
  return context;
}