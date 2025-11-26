// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './SparkMultiIcon.css';
import React from 'react';
import { ReactComponent as SparkIcon } from 'components/atoms/icons/misc/spark.svg';

type Props = {
  iconCount: number;
};

const SparkMultiIcon: React.FC<Props> = (props) => {
  return <div className='spark-multi-icon'>
    {Array.from(Array(props.iconCount).keys()).map(sparkCount => <SparkIcon key={sparkCount} className='w-12 h-12' />)}
  </div>;
}

export default React.memo(SparkMultiIcon);