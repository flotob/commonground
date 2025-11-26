// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { Children, useMemo, useState } from 'react';
import { ReactComponent as CheckedIcon } from 'components/atoms/icons/24/RadioButtonChecked.svg';
import { ReactComponent as UncheckedIcon } from 'components/atoms/icons/24/RadioButtonUnchecked.svg';

import './CollapsableGroup.css';

type Props = {
}

const CollapsableGroup: React.FC<React.PropsWithChildren<Props>> = ({children}) => {

  return <div className="collapsable-group">
    {children}
  </div>
};

export default React.memo(CollapsableGroup);