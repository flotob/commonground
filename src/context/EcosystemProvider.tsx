// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "common/config";
import React, { useEffect, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";

const allEcosystems = ['cg', 'fuel', 'lukso', 'powershift', 'cannabis-social-clubs', 'si3'] as const;
export type EcosystemType = typeof allEcosystems[number];

const stagingEcosystems: EcosystemType[] = ['fuel', 'lukso','si3', 'cannabis-social-clubs', 'powershift'];
const prodEcosystems: EcosystemType[] = ['fuel', 'lukso','si3', 'cannabis-social-clubs', 'powershift'];
export let ecosystems: EcosystemType[];

if (config.DEPLOYMENT === 'prod') {
  ecosystems = prodEcosystems;
} else {
  ecosystems = stagingEcosystems;
}

type EcosystemContextState = {
  ecosystem: EcosystemType | null;
  setEcosystem: (ecosystemType: EcosystemType | null) => void
}

export const EcosystemProviderContext = React.createContext<EcosystemContextState>({
  ecosystem: null,
  setEcosystem: () => {},
});

export function EcosystemProvider(props: React.PropsWithChildren) {
  const [ecosystem, setEcosystem] = React.useState<EcosystemType | null>(null);

  useEffect(() => {
    // if (ecosystem === 'fuel') {
    //   document.body.style.setProperty('--text-highlight', 'var(--colours-integrations-fuel)');
    //   document.body.style.setProperty('--border-highlight', 'var(--colours-integrations-fuel-shaded)');
    //   document.body.style.setProperty('--surface-buttons-primary', 'var(--colours-integrations-fuel)');
    //   document.body.style.setProperty('--surface-buttons-primary-hover', 'var(--colours-integrations-fuel-light)');
    //   document.body.style.setProperty('--surface-buttons-primary-active', 'var(--colours-integrations-fuel-dark)');
    //   document.body.style.setProperty('--surface-buttons-text-primary', 'var(--text-full-black)');
    //   document.body.style.setProperty('--text-button-primary', 'var(--text-full-black)');
    //   document.body.style.setProperty('--surface-buttons-text-primary-active', 'var(--text-full-white)');
    //   document.body.style.setProperty('--btnPrimaryBoxShadow', 'var(--colours-integrations-fuel-box-shadow)');
    //   document.body.style.setProperty('--btnPrimaryActiveBoxShadow', 'var(--colours-integrations-fuel-box-shadow-active)');
    //   // document.body.style.setProperty('--surface-buttons-primary-checkbox', 'var(--colours-integrations-fuel-shaded)');
    //   // document.body.style.setProperty('--notificationCountBg', 'var(--colours-integrations-fuel-shaded)');
    //   // document.body.style.setProperty('--notificationCountText', 'var(--text-full-white)');
    //   document.body.style.setProperty('--surface-subtleoverlay-eco', 'var(--colours-overlays-white5percent)');
    //   document.body.style.setProperty('--text-primary-eco', 'var(--colours-dark-50)');
    // } else if (ecosystem === 'lukso') {
    //   document.body.style.setProperty('--text-highlight', 'var(--colours-integrations-lukso)');
    //   document.body.style.setProperty('--border-highlight', 'var(--colours-integrations-lukso-light)');
    //   document.body.style.setProperty('--surface-buttons-primary', 'var(--colours-integrations-lukso)');
    //   document.body.style.setProperty('--surface-buttons-primary-hover', 'var(--colours-integrations-lukso-light)');
    //   document.body.style.setProperty('--surface-buttons-primary-active', 'var(--colours-integrations-lukso-dark)');
    //   document.body.style.setProperty('--surface-buttons-text-primary', 'var(--text-full-white)');
    //   document.body.style.setProperty('--text-button-primary', 'var(--text-full-white)');
    //   document.body.style.removeProperty('--surface-buttons-text-primary-active');
    //   document.body.style.setProperty('--btnPrimaryBoxShadow', 'var(--colours-integrations-lukso-box-shadow)');
    //   document.body.style.setProperty('--btnPrimaryActiveBoxShadow', 'var(--colours-integrations-lukso-box-shadow-active)');
    //   // document.body.style.removeProperty('--surface-buttons-primary-checkbox');
    //   // document.body.style.setProperty('--notificationCountBg', 'var(--colours-integrations-lukso)');
    //   // document.body.style.setProperty('--notificationCountText', 'var(--text-full-white)');
    //   document.body.style.setProperty('--surface-subtleoverlay-eco', 'var(--colours-overlays-black5percent)');
    //   document.body.style.setProperty('--text-primary-eco', 'var(--colours-light-950)');
    // } else if (ecosystem === 'powershift') {
    //   document.body.style.setProperty('--text-highlight', 'var(--text-primary)');
    //   document.body.style.setProperty('--border-highlight', 'var(--colours-integrations-encode-light)');
    //   document.body.style.setProperty('--surface-buttons-primary', 'var(--colours-integrations-encode)');
    //   document.body.style.setProperty('--surface-buttons-primary-hover', 'var(--colours-integrations-encode-light)');
    //   document.body.style.setProperty('--surface-buttons-primary-active', 'var(--colours-integrations-encode-dark)');
    //   document.body.style.setProperty('--surface-buttons-text-primary', 'var(--text-full-white)');
    //   document.body.style.setProperty('--text-button-primary', 'var(--text-full-white)');
    //   document.body.style.removeProperty('--surface-buttons-text-primary-active');
    //   document.body.style.setProperty('--btnPrimaryBoxShadow', 'var(--colours-integrations-encode-box-shadow)');
    //   document.body.style.setProperty('--btnPrimaryActiveBoxShadow', 'var(--colours-integrations-encode-box-shadow-active)');
    //   // document.body.style.setProperty('--surface-buttons-primary-checkbox', 'var(--colours-integrations-encode-light)');
    //   // document.body.style.setProperty('--notificationCountBg', 'var(--colours-integrations-encode-light)');
    //   // document.body.style.setProperty('--notificationCountText', 'var(--text-full-white)');
    //   document.body.style.setProperty('--surface-subtleoverlay-eco', 'var(--colours-overlays-black5percent)');
    //   document.body.style.setProperty('--text-primary-eco', 'var(--colours-light-950)');
    // } else {
      document.body.style.removeProperty('--text-highlight');
      document.body.style.removeProperty('--border-highlight');
      document.body.style.removeProperty('--surface-buttons-primary');
      document.body.style.removeProperty('--surface-buttons-primary-hover');
      document.body.style.removeProperty('--surface-buttons-primary-active');
      document.body.style.removeProperty('--surface-buttons-text-primary');
      document.body.style.removeProperty('--text-button-primary');
      document.body.style.removeProperty('--surface-buttons-text-primary-active');
      document.body.style.removeProperty('--btnPrimaryBoxShadow');
      document.body.style.removeProperty('--btnPrimaryActiveBoxShadow');
      // document.body.style.removeProperty('--surface-buttons-primary-checkbox');
      // document.body.style.removeProperty('--notificationCountBg');
      // document.body.style.removeProperty('--notificationCountText');
      document.body.style.removeProperty('--surface-subtleoverlay-eco');
      document.body.style.removeProperty('--text-primary-eco');
    // }
  }, [ecosystem]);

  return (
    <EcosystemProviderContext.Provider value={{ ecosystem: ecosystem , setEcosystem }}>
      {props.children}
    </EcosystemProviderContext.Provider>
  );
}

export function EcosystemParamSetter(props: React.PropsWithChildren) {
  const { ecosystem, setEcosystem } = useEcosystemContext();
  const { ecosystem: paramEcosystem } = useParams<'ecosystem'>();

  useLayoutEffect(() => {
    if (ecosystem !== paramEcosystem) {
      setEcosystem(paramEcosystem as EcosystemType);
    }
  }, [ecosystem, paramEcosystem, setEcosystem]);

  return <>{props.children}</>;
}

export function useEcosystemContext() {
  const context = React.useContext(EcosystemProviderContext);
  return context;
}