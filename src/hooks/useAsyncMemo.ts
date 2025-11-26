// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useEffect, useState } from 'react';

export function useAsyncMemo<T>(factory: () => Promise<T>, deps: React.DependencyList, options?: {
  nullValueOnChange?: boolean;
}): T | undefined {
    const [value, setValue] = useState<T | undefined>(undefined);

    useEffect(() => {
      let cancel = false;
      if (options?.nullValueOnChange) setValue(undefined);
      const promise = factory();
      if (promise === undefined || promise === null) return;
      promise.then((val) => {
        if (!cancel) setValue(val);
      });
      return () => {
        cancel = true
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return value;
}