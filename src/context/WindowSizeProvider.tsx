// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useLayoutEffect, useState } from "react";

type WindowSizeState = {
  width: number;
  height: number;
  isMobile: boolean;
  isSmallTablet: boolean;
  isTablet: boolean;
}

export const WindowSizeContext = React.createContext<WindowSizeState>({width: 0, height: 0, isMobile: false, isSmallTablet: false, isTablet: false});

export function WindowSizeProvider(props: React.PropsWithChildren<{}>) {
  const [ size, setSize ] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: (window.innerWidth < 640),
    isSmallTablet: (window.innerWidth >= 640 && window.innerWidth <= 800),
    isTablet: (window.innerWidth >= 640 && window.innerWidth < 1024)
  });

  const viewportTopScrollChanged = useCallback((newTop: `${number}px`) => {
    document.body.style.paddingTop = newTop;
    const modalRoot = document.getElementById("modal-root-anchor");
    if (modalRoot) {
      modalRoot.style.top = newTop;
    }
    const background = document.getElementsByClassName("background")[0];
    if (background) {
      (background as HTMLDivElement).style.top = newTop;
    }
    const managementModalRoot = document.getElementById("management-content-modal-root");
    if (managementModalRoot) {
      managementModalRoot.style.top = newTop;
    }
    const scrollableGrabbedOverlay = document.getElementById("cg-scrollable-grabbed-overlay");
    if (scrollableGrabbedOverlay) {
      scrollableGrabbedOverlay.style.top = newTop;
    }
    const cgPreview = document.getElementById("cg-preview");
    if (cgPreview) {
      cgPreview.style.top = newTop;
    }
    const connectionIndicator = document.getElementById("cg-connection-indicator");
    if (connectionIndicator) {
      connectionIndicator.style.top = `max(1rem, ${newTop})`;
    }
  }, []);

  useLayoutEffect(() => {
    function handleResize() {
      let height: number;
      if (!!window.visualViewport) {
        height = window.visualViewport.height;
        viewportTopScrollChanged(`${window.visualViewport.pageTop}px`);
      } else {
        height = window.innerHeight;
      }
      document.body.style.setProperty('--visualHeight', `${height}px`);
      document.documentElement.style.height = `${height}px`;

      setSize({
        height,
        width: window.innerWidth,
        isMobile: (window.innerWidth < 640),
        isSmallTablet: (window.innerWidth >= 640 && window.innerWidth <= 800),
        isTablet: (window.innerWidth >= 640 && window.innerWidth <= 1024)
      });
    }

    function handleViewportScroll(this: VisualViewport, ev: Event) {
      viewportTopScrollChanged(`${this.pageTop}px`);
    }
    
    if (!!window.visualViewport) {
      handleResize();
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleViewportScroll);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (!!window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleViewportScroll);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    }
  }, []);

  return (
    <WindowSizeContext.Provider value={size}>
      {props.children}
    </WindowSizeContext.Provider>
  )
}

export function useWindowSizeContext() {
  const context = React.useContext(WindowSizeContext);
  return context;
}