// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import { IdentificationCard, Robot, Sparkle, Swap } from '@phosphor-icons/react';
import mock1Image from './mockImgs/mock1.webp';
import mock2Image from './mockImgs/mock2.webp';
import mock3Image from './mockImgs/mock3.webp';

const TokenSaleFeaturePreviews = () => {
  return (
    <div className="max-w-[800px] flex flex-col gap-16 justify-self-center" id="feature-previews">
      <div className='flex flex-col gap-2 items-center'>
        <h2>Feature Previews</h2>
        <p className="cg-heading-3 cg-text-secondary text-center max-w-[480px]">
          We're making trading, voting, and coordinating easy.
          Here's a preview of what's next, and what your
          investment will be key to fund.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className='flex items-center gap-2'>
          <Swap weight='duotone' className='w-5 h-5 cg-text-secondary' />
          <h3 className="flex-1">
            Embed your own project as an app on Common Ground
          </h3>
        </div>

        <p className="cg-text-lg-500 cg-text-secondary max-w-[480px] pl-7">
          Develop and publish your own application within Common Ground
          and then interact with other users and communities within a shared platform.
        </p>

        <img
          src={mock1Image}
          alt="Trading interface preview"
        />
      </div>   

      <div className="flex flex-col gap-6">
        <div className='flex items-center gap-2'>
          <Robot weight='duotone' className='w-5 h-5 cg-text-secondary' />
          <h3 className="flex-1">
            Fully Autonomous AI Community Agents
          </h3>
        </div>

        <p className="cg-text-lg-500 cg-text-secondary max-w-[480px] pl-7">
          Your community’s new ambassador: the opt-in AI Agent that answers questions based on your project’s history, hangs out with your community, and can vibe however you want
        </p>

        <img
          src={mock3Image}
          alt="Agent preview"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className='flex items-center gap-2'>
          <Sparkle weight='duotone' className='w-5 h-5 cg-text-secondary' />
          <h3 className="flex-1">
            Tradeable Communities and Custom Tokens
          </h3>
        </div>

        <p className="cg-text-lg-500 cg-text-secondary max-w-[480px] pl-7">
          Common Ground makes monetizing your community easy. Create your community with a token, and trade it with others.
        </p>

        <img
          src={mock2Image}
          alt="Passport preview"
        />
      </div>

      <div className='flex flex-col gap-2 items-center'>
        <h2>...And more!</h2>
        <p className="cg-heading-3 cg-text-secondary text-center max-w-[480px]">
          From community vaults to onchain governance, the road to network societies is paved on Common Ground.
        </p>
      </div>
    </div>
  )
}

export default React.memo(TokenSaleFeaturePreviews)