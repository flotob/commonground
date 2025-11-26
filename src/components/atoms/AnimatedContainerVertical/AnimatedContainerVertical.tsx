// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useEffect, useRef, useState } from 'react';
import './AnimatedContainerVertical.css';

type Props = {
  className?: string;
}

const AnimatedContainerVertical: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const { className, children } = props;
  const [currentHeight, setCurrentHeight] = useState(0);
  const innerRef = useRef<HTMLDivElement>(null);

  // Resize listener for grow/shrink animation
  useEffect(() => {
    const listener: ResizeObserverCallback = async ([entry]) => {
      if (entry) {
        const height = entry.contentRect.height;
        setCurrentHeight(height);
      }
    }

    const observer = new ResizeObserver(listener);
    if (innerRef.current) {
      observer.observe(innerRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  return (
    <div className="animated-container-vertical-outer w-full" style={{height: currentHeight}}>
      <div className={className} ref={innerRef}>
        {children}
      </div>
    </div>
  )
}

export default React.memo(AnimatedContainerVertical);