// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'

type Props = {

};

const NUM_PARTICLES = 50;

const SparkFireBg: React.FC<Props> = (props) => {
  return <div className='spark-fire-bg'>
    {Array.from(Array(50).keys()).map(idx => <div
      key={idx}
      className='spark-fire-particle'
      style={{
        animationDelay: `${2 * Math.random()}s`,
        left: `calc((100% - 5em) * ${idx / NUM_PARTICLES})`
      }}>
    </div>)}
  </div>
}

export default React.memo(SparkFireBg);