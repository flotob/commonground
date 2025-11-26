// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo } from 'react';
import './TokenSaleInfo.css';
import InfoArticleBox from './InfoArticleBox';
import { useDarkModeContext } from 'context/DarkModeProvider';
import TokenSaleInvestors from './TokenSaleInvestors';
import TokenDistributionGraph from '../Charts/TokenDistributionGraph';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import TokenSaleFeaturePreviews from './TokenSaleFeaturePreviews';
import { Decimal, formatNumberRemoveTrailingZeros, getExactTokenAmount, priceFn, shortenMillBillNumber } from 'common/tokensale/helper';
import Jdenticon from 'components/atoms/Jdenticon/Jdenticon';
import { useMultipleUserData } from 'context/UserDataProvider';
import { ethers } from 'ethers';
import UserTooltip from 'components/organisms/UserTooltip/UserTooltip';
import { getDisplayName } from '../../../util';
import { Decimal as DecimalType } from 'decimal.js';

const tokenSaleInfoArticles = [
  {
    communityId: 'b1bc89fc-b9b3-430d-a50b-da966c67e8f7',
    articleId: '9172fead-6584-48bd-91e2-20b9664f424e',
    buttonText: 'Read more about Token Story',
    darkmode: {
      backgroundColor: '#443629',
      titleColor: '#EAB958',
    },
    lightmode: {
      backgroundColor: '#FFF5E9',
      titleColor: '#A9752B',
    },
  },
  {
    communityId: 'b1bc89fc-b9b3-430d-a50b-da966c67e8f7',
    articleId: '4f2019ac-8c86-49ac-99bf-79ef1a596fc5',
    buttonText: 'Read more about CG',
    darkmode: {
      backgroundColor: '#283241',
      titleColor: '#009EE0',
    },
    lightmode: {
      backgroundColor: '#E1EEFF',
      titleColor: '#009EE0',
    },
  },
  {
    communityId: 'b1bc89fc-b9b3-430d-a50b-da966c67e8f7',
    articleId: '559f28a6-a875-42f0-90f7-72401087a2ad',
    buttonText: 'Read more about Value Capture',
    darkmode: {
      backgroundColor: '#363636',
      titleColor: 'var(--text-primary)',
    },
    lightmode: {
      backgroundColor: 'rgba(75, 47, 42, 0.05)',
      titleColor: 'var(--text-primary)',
    },
  },
  {
    communityId: 'b1bc89fc-b9b3-430d-a50b-da966c67e8f7',
    articleId: '1bee1eb4-c722-45fa-aa36-4d8eed545d27',
    buttonText: 'Read more about our Team',
    darkmode: {
      backgroundColor: '#4B2F2A',
      titleColor: '#D74538',
    },
    lightmode: {
      backgroundColor: '#FFE4DE',
      titleColor: '#D74538',
    },
  },
];

type Props = {
  investmentEvents: Models.Contract.SaleInvestmentEvent[];
}

const TokenSaleInfo: React.FC<Props> = ({ investmentEvents }) => {
  const { isMobile } = useWindowSizeContext();
  const { isDarkMode } = useDarkModeContext();

  const userIds = useMemo(() => {
    const idSet = investmentEvents.reduce((acc, event) => {
      acc.add(event.userId);
      return acc;
    }, new Set<string>());
    return Array.from(idSet);
  }, [investmentEvents]);

  const aggregatedEvents = useMemo(() => {
    return investmentEvents.reduce((acc, event) => {
      const existingEvent = acc.find(e => e.userId === event.userId);
      if (existingEvent) {
        existingEvent.invested = existingEvent.invested + event.investedAmount;
        existingEvent.received = existingEvent.received.plus(getExactTokenAmount(new Decimal(ethers.utils.formatEther(event.saleProgressBefore)), new Decimal(ethers.utils.formatEther(event.investedAmount))));
      } else {
        acc.push({
          userId: event.userId,
          invested: event.investedAmount,
          received: getExactTokenAmount(new Decimal(ethers.utils.formatEther(event.saleProgressBefore)), new Decimal(ethers.utils.formatEther(event.investedAmount)))
        });
      }
      return acc;
    }, [] as { userId: string; invested: bigint; received: DecimalType }[])
    .sort((a, b) => {
      // Sort by invested in descending order
      if (a.invested > b.invested) return -1;
      if (a.invested < b.invested) return 1;
      return 0;
    });
  }, [investmentEvents]);

  const userData = useMultipleUserData(userIds);

  const minimumTokenPriceEth = useMemo(() => {
    return priceFn(new Decimal(0));
  }, []);

  const maximumTokenPriceEth = useMemo(() => {
    return priceFn(new Decimal(3000));
  }, []);

  const minimumTokenPriceString = useMemo(() => {
    return formatNumberRemoveTrailingZeros(minimumTokenPriceEth.mul(new Decimal(10).pow(new Decimal(6))));
  }, [minimumTokenPriceEth]);

  const maximumTokenPriceString = useMemo(() => {
    return formatNumberRemoveTrailingZeros(maximumTokenPriceEth.mul(new Decimal(10).pow(new Decimal(6))));
  }, [maximumTokenPriceEth]);

  const minimumImpliedValuation = useMemo(() => {
    return new Decimal(49).mul(new Decimal(10).pow(new Decimal(9))).mul(minimumTokenPriceEth);
  }, [minimumTokenPriceEth]);

  const maximumImpliedValuation = useMemo(() => {
    return new Decimal(49).mul(new Decimal(10).pow(new Decimal(9))).mul(maximumTokenPriceEth);
  }, [maximumTokenPriceEth]);

  const minimumImpliedValuationString = useMemo(() => {
    return shortenMillBillNumber(minimumImpliedValuation);
  }, [minimumImpliedValuation]);

  const maximumImpliedValuationString = useMemo(() => {
    return shortenMillBillNumber(maximumImpliedValuation);
  }, [maximumImpliedValuation]);

  const totalBuyableTokens = useMemo(() => {
    return getExactTokenAmount(new Decimal(0), new Decimal(3000));
  }, []);

  const totalBuyableTokensString = useMemo(() => {
    return shortenMillBillNumber(totalBuyableTokens);
  }, [totalBuyableTokens]);

  const referralBonusTokens = useMemo(() => {
    return totalBuyableTokens.div(new Decimal(9)); // 1/9 of the total buyable tokens, since this is 11.11111...%
  }, [totalBuyableTokens]);

  const referralBonusTokensString = useMemo(() => {
    return shortenMillBillNumber(referralBonusTokens);
  }, [referralBonusTokens]);

  return <>
    <div className='flex flex-col items-center gap-4 max-w-full relative justify-self-center' id="our-investors">
      <div className='flex flex-col items-center gap-1'>
        <h2>Our Investors</h2>
        <h3>Those who believed in us for years</h3>
      </div>
      <div className='relative' style={{ width: 'calc(100% + 2rem)' }}>
        <TokenSaleInvestors />
      </div>

      <h3 className='pt-8'>Investments from our community</h3>
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-x-4 gap-y-8 cg-bg-subtle cg-box-shadow-md cg-border-panels cg-border-xl py-8 px-4 w-full max-w-[800px] justify-self-center`}>
        {aggregatedEvents.map((investment, index) => (
          <div key={`${investment.userId}`} className='flex flex-col items-center gap-2'>
            <UserTooltip
              userId={investment.userId}
              isMessageTooltip={false}
              triggerClassName='flex flex-col gap-2 items-center max-w-full'
            >
              <Jdenticon
                userId={investment.userId}
                predefinedSize='80'
              />
              <div className='cg-heading-2 max-w-full'>{userData[investment.userId] ? getDisplayName(userData[investment.userId]) : ''}</div>
            </UserTooltip>
            <div className="flex flex-col items-center gap-1">
              <span className='cg-text-lg-500 text-center'>Invested {ethers.utils.formatEther(investment.invested)} ETH</span>
              <span className='cg-text-lg-500 text-center cg-text-brand'>Received {shortenMillBillNumber(investment.received)} $CG</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6 max-w-[800px] justify-self-center`}>
      {tokenSaleInfoArticles.map((article, index) => (
        <InfoArticleBox
          key={`${article.articleId}-${index}`}
          articleId={article.articleId}
          communityId={article.communityId}
          buttonText={article.buttonText}
          backgroundColor={isDarkMode ? article.darkmode.backgroundColor : article.lightmode.backgroundColor}
          titleColor={isDarkMode ? article.darkmode.titleColor : article.lightmode.titleColor}
        />
      ))}
    </div>

    <div className='grid grid-cols-1 gap-2 max-w-[800px] w-full justify-self-center text-center' id="token-distribution">
      <h2>Token Distribution</h2>
      <h3 className='cg-text-secondary'>We’ve been very thoughtful about how our Token is created and distributed. Here is an overview:</h3>
      <TokenDistributionGraph />
    </div>

    <div className='flex flex-col items-center gap-2 max-w-[800px] justify-self-center' id="token-offer">
      <h2>Token Stats</h2>
      <div className='overflow-x-auto px-4 flex' style={{ maxWidth: '100vw' }}>
        <div className='flex cg-bg-subtle cg-border-xxl p-2'>
          <div className={`cg-bg-subtle cg-box-shadow-md cg-border-panels cg-border-xxl grid grid-cols-3 gap-y-4 tokensale-info-table p-4 ${isMobile ? 'min-w-[500px]' : ''}`}>
            <div className="cg-text-lg-500 px-4 min-h-[64px] flex items-center">Tradeable Token Supply</div>
            <div className="cg-text-md-400 px-4 min-h-[64px] flex items-center">49B</div>
            <div className="cg-text-md-400 px-4 min-h-[64px] flex items-center">Total amount of tradeable tokens, no mint function</div>

            <div className="cg-text-lg-500 px-4 min-h-[64px] flex items-center">Community Fund</div>
            <div className="cg-text-md-400 px-4 min-h-[64px] flex items-center">51B</div>
            <div className="cg-text-md-400 px-4 min-h-[64px] flex items-center">Total amount of non-tradeable tokens reserved for the community fund. This is a different token than the tradeable token, but it has the same utility as the tradeable token</div>

            <div className="cg-text-lg-500 px-4 min-h-[64px] flex items-center">Chain</div>
            <div className="cg-text-md-400 px-4 min-h-[64px] flex items-center">Ethereum Mainnet</div>
            <div className="cg-text-md-400 px-4 min-h-[64px] flex items-center">The $CG token is an ERC-20 token on Ethereum Mainnet</div>

            {/* <div className="cg-text-lg-500 px-2 min-h-[64px] flex items-center">Tokens for Sale</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">{totalBuyableTokensString}</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">Maximum amount of tokens sold if the hardcap is reached</div>

            <div className="cg-text-lg-500 px-2 min-h-[64px] flex items-center">Referral Bonus Tokens</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">up to {referralBonusTokensString}</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">Maximum amount of tokens earnable through referrals</div>

            <div className="cg-text-lg-500 px-2 min-h-[64px] flex items-center">Token Price</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">{minimumTokenPriceString} - {maximumTokenPriceString} µETH</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">The minimum and maximum price of the token</div>

            <div className="cg-text-lg-500 px-2 min-h-[64px] flex items-center">Implied Valuation</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">{minimumImpliedValuationString} - {maximumImpliedValuationString} ETH</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">The implied minimum and maximum valuation of the total tradeable supply</div>

            <div className="cg-text-lg-500 px-2 min-h-[64px] flex items-center">Hard Cap</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">3000 ETH</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">The maximum amount of ETH that can be invested</div>

            <div className="cg-text-lg-500 px-2 min-h-[64px] flex items-center">Sale End Date</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">anticipated as December 30, 2024, at 12:00 p.m. UTC</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">potentially extended for some geographic regions</div>

            <div className="cg-text-lg-500 px-2 min-h-[64px] flex items-center">Token Delivery</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">latest 12 months after the Sale End Date</div>
            <div className="cg-text-md-400 px-2 min-h-[64px] flex items-center">currently we plan to deliver the token during Q1 2025, if all things go as expected</div> */}
          </div>
        </div>
      </div>
    </div>

    <TokenSaleFeaturePreviews />

    {/* TODO: Bring me back in the future */}
    {/* <div className='flex flex-col items-center gap-8 max-w-[800px] justify-self-center w-full px-4'>
      <div className='flex flex-col items-center gap-1'>
        <h2>Our Vision for Common Ground</h2>
        <h3><Steps weight='duotone' className='w-5 h-5' /> Roadmap</h3>
      </div>
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-2'} w-full`}>
        <div className={`cg-content-stack p-4 flex flex-col gap-4 cg-border-xxl h-[360px]`}>
          <div className='flex flex-col gap-2'>
            <h3 className='cg-text-brand'>All-in Onchain</h3>
            <h3>Web3 integrations where it matters</h3>
          </div>
          <div className='cg-text-lg-400 flex-1'>
            Dolore veniam magna tempor anim laboris fugiat consectetur non velit cillum. Cillum dolore qui tempor deserunt id. Occaecat ea in laboris minim nulla ullamco quis. Ex enim do excepteur do ea Lorem deserunt amet. Ipsum et dolore nostrud occaecat.
          </div>
          <div className='flex items-center justify-center cg-text-lg-500 cg-text-brand w-full py-2 cg-circular cg-bg-subtle'>Ongoing</div>
        </div>

        <div className={`cg-content-stack p-4 flex flex-col gap-4 cg-border-xxl h-[360px] ${!isMobile && 'mt-7'}`}>
          <div className='flex flex-col gap-2'>
            <h3 className='cg-text-brand'>Open Source</h3>
            <h3>Give back to the whole space</h3>
          </div>
          <div className='cg-text-lg-400 flex-1'>
            Dolore veniam magna tempor anim laboris fugiat consectetur non velit cillum. Cillum dolore qui tempor deserunt id. Occaecat ea in laboris minim nulla ullamco quis. Ex enim do excepteur do ea Lorem deserunt amet. Ipsum et dolore nostrud occaecat.
          </div>
          <div className='flex items-center justify-center cg-text-lg-500 cg-text-brand w-full py-2 cg-circular cg-bg-subtle'>Not yet started</div>
        </div>

        <div className={`cg-content-stack p-4 flex flex-col gap-4 cg-border-xxl h-[360px] ${!isMobile && 'mt-14'}`}>
          <div className='flex flex-col gap-2'>
            <h3 className='cg-text-brand'>Governance 2.0</h3>
            <h3>Build more, faster, in alignment with holders</h3>
          </div>
          <div className='cg-text-lg-400 flex-1'>
            Dolore veniam magna tempor anim laboris fugiat consectetur non velit cillum. Cillum dolore qui tempor deserunt id. Occaecat ea in laboris minim nulla ullamco quis.
          </div>
          <div className='flex items-center justify-center cg-text-lg-500 cg-text-brand w-full py-2 cg-circular cg-bg-subtle'>Not yet started</div>
        </div>
      </div>
    </div> */}
  </>;
};

export default TokenSaleInfo;