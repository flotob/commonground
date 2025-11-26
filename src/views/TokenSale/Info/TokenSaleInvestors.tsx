// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/20/solid';
import React, { useRef } from 'react';
import { ReactComponent as KlerosLogo } from './investorsImgs/kleros.svg';
import { ReactComponent as ThreeCommaLogo } from './investorsImgs/3comma.svg';
import { ReactComponent as OvLogo } from './investorsImgs/ov.svg';
import { ReactComponent as FuelLogo } from '../../../components/atoms/icons/24/Fuel.svg';
import CvLogo from './investorsImgs/cv.jpg';
import ThreeCommaLogoImg from './investorsImgs/3comma.svg';
import klerosImg from './investorsImgs/kleros.svg';

import ohxmahaImg from './investorPeopleImgs/ohxmaha.jpg';
import brianImg from './investorPeopleImgs/brian.jpg';
import christophImg from './investorPeopleImgs/christoph.jpg';
import fabianImg from './investorPeopleImgs/fabian.jpg';
import hananImg from './investorPeopleImgs/hanan.jpg';
import nickImg from './investorPeopleImgs/nick.png';
import patrickImg from './investorPeopleImgs/patrick.webp';
import timoImg from './investorPeopleImgs/timo.jpg';
import juanImg from './investorPeopleImgs/juan.jpg';

interface Investor {
  investorFirmName?: string;
  investorFirm?: string;
  name: string;
  logo: string;
  NoBigLogoRounding?: boolean;
  logoNoRounding?: boolean;
  description: string;
  subDescription: string;
  text: string;
}

const investors: Investor[] = [
  {
    investorFirmName: 'Corpus.Ventures',
    investorFirm: 'cv',
    name: 'Christoph Jentzsch',
    logo: christophImg,
    description: 'Ethereum dev pre mainnet launch, Founded the first DAO on Ethereum',
    subDescription: 'Put in $200k',
    text: '"Since I\'ve built TheDAO in 2016, I dreamed of a web3-native communications tool. When I saw Common Ground I wrote their first angel check because I knew this team understands that vision deeply and will make it happen."'
  },
  {
    investorFirmName: 'Outlier Ventures',
    investorFirm: 'ov',
    name: 'Hanan Nor',
    logo: hananImg,
    description: 'Investor at Outlier Ventures',
    subDescription: 'Put in $100k',
    text: '"Common Ground was an easy decision for me. The founder vision is extremely strong, paired with a capable tech team and a commitment not to stop before the job is done."'
  },
  {
    investorFirmName: 'Patrick Hable',
    investorFirm: 'patrick',
    name: '3comma',
    logo: ThreeCommaLogoImg,
    logoNoRounding: true,
    description: 'Managing Partner at 3Comma Capital',
    subDescription: 'Put in $300k',
    text: '"I was about to build the same app when I met the CG team. Given the complexity of the problem and the insane commitment needed to see it through, I was glad to fund them with a large check."'
  },
  {
    name: 'Fabian Vogelsteller',
    logo: fabianImg,
    description: 'Ethereum dev pre mainnet launch, invented ERC, ERC20, ERC725 and LUKSO',
    subDescription: 'Put in $50k',
    text: '"Common Ground gets it: identity is the center piece around which web3 mass adoption will happen. CG is the first social app properly implementing onchain identities. When I got a chance to make an OG check, I replied: how much?"'
  },
  {
    name: 'Brian Fabian Crain',
    logo: brianImg,
    description: 'Founder of Chorus One & Early investor in Bitcoin, Ethereum, Cosmos, Solana, and Urbit',
    subDescription: 'Put in $30K',
    text: '“A decentralized community owned messaging app is a core component of a decentralized economy that enables more freedom. Common ground has the right vision and a principled OG team.”'
  },
  {
    investorFirmName: 'Fuel Network',
    investorFirm: 'fuel',
    name: 'Nick Dodson',
    logo: nickImg,
    description: 'Founder of Fuel Network and aspiring crypto philosopher',
    subDescription: 'Put in $50k',
    text: '"We funded Common Ground with a grant because they bring tremendous value to our ecosystem. Soon, every chain will drive growth by merging social and financial primitives in interesting ways: Common Ground is showing us how."'
  },
  {
    name: 'Juan G',
    logo: juanImg,
    description: 'Sustainable Ecosystem Scaling at MakerDAO',
    subDescription: 'Put in $25k',
    text: '“There’s an entire industry of DAO Operators who have mastered the art of using workarounds to patch processes still rooted in skeuomorphic applications from outdated paradigms. The team at Commonground is uniquely positioned to build the native apps essential for advancing Web3 to its next stage of maturity.”'
  },
  {
    name: 'Kleros',
    logo: klerosImg,
    description: '',
    NoBigLogoRounding: true,
    subDescription: 'Put in $50k',
    text: '"Common Ground solves the long-standing problem of crypto not having a beautiful & functional app layer from which users & groups can coordinate and act onchain."'
  },
  {
    name: '0xMaha',
    logo: ohxmahaImg,
    description: 'Founder of Aura Finance',
    subDescription: 'Put in $25k',
    text: '"I couldn\'t care less about what the CG team is building. I invested because I love their vibes and I know whatever it is they\'re doing, it needs to happen."'
  },
  {
    name: 'Timo Meyer',
    logo: timoImg,
    description: 'OG Web1 Builder with multiple exits in gaming & angel investor in early stage web3 projects',
    subDescription: 'Put in $25k',
    text: '"It\'s obvious that we\'ll see a platform shift in messaging once web3 is going more mainstream. I love where Common Ground is headed."'
  }
];

function getInvestorFirmLogo(investorFirm: Investor['investorFirm']): JSX.Element | null {
  switch (investorFirm) {
    case 'kleros':
      return <KlerosLogo className='w-full' />;
    case '3comma':
      return <ThreeCommaLogo className='w-full' />;
    case 'ov':
      return <OvLogo className='w-full' />;
    case 'cv':
      return <img src={CvLogo} alt="CV logo" className='w-full h-full object-contain' />;
    case 'fuel':
      return <FuelLogo className='w-full' />;
    case 'patrick':
      return <img src={patrickImg} alt="Patrick logo" className='w-36 h-36 object-cover rounded-full' />;
  }
  return null;
}

const TokenSaleInvestors: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const checkScroll = () => {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      const isNotAtEnd = (container.scrollLeft + 5) < (container.scrollWidth - container.clientWidth);

      setShowRightArrow(hasOverflow && isNotAtEnd);
      setShowLeftArrow(container.scrollLeft > 0);
    };

    // Check initially
    checkScroll();

    // Add scroll listener
    container.addEventListener('scroll', checkScroll);
    // Add resize listener to handle window changes
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  // // Adjust margin of first investor card to center align when viewport is wider than 800px
  // React.useEffect(() => {
  //   const tokenSaleRoot = document.querySelector('.tokensale-root');
  //   if (!tokenSaleRoot) return;

  //   const resizeObserver = new ResizeObserver(() => {
  //     const container = scrollRef.current;
  //     if (!container || !container.firstElementChild || !container.lastElementChild) return;

  //     const rootWidth = tokenSaleRoot.clientWidth;
  //     if (rootWidth > 800) {
  //       const margin = Math.floor((rootWidth - 800) / 2);
  //       (container.firstElementChild as HTMLElement).style.marginLeft = `${margin}px`;
  //       (container.lastElementChild as HTMLElement).style.marginRight = `${margin}px`;
  //     } else {
  //       (container.firstElementChild as HTMLElement).style.marginLeft = '0px';
  //       (container.lastElementChild as HTMLElement).style.marginRight = '0px';
  //     }
  //   });

  //   resizeObserver.observe(tokenSaleRoot);

  //   return () => {
  //     resizeObserver.disconnect();
  //   };
  // }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scroll({
        left: scrollRef.current.scrollLeft + (direction === 'left' ? -370 : 370),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex gap-6 token-sale-investors w-full py-0.5" ref={scrollRef}>
      {investors.map((investor, index) => {
        const hasInvestorFirmLogo = investor.investorFirm !== undefined;

        return (<div key={index}>
          <div
            className="flex flex-col items-center justify-between p-6 gap-6 cg-bg-subtle cg-box-shadow-md cg-border-panels cg-border-xxl min-w-[370px] w-[370px] h-[620px]"
          >
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className='flex items-center justify-center h-56 w-full max-w-[180px]'>
                {hasInvestorFirmLogo && getInvestorFirmLogo(investor.investorFirm)}
                {!hasInvestorFirmLogo && <img
                  src={investor.logo}
                  alt={`${investor.name} logo`}
                  className={investor.NoBigLogoRounding ? 'w-full h-full object-contain' : 'w-36 h-36 rounded-full object-cover'}
                />}
              </div>
              <div className="flex flex-col items-center gap-1">
                {/* {hasInvestorFirmLogo && <img
                  src={investor.logo}
                  alt={`${investor.name} logo`}
                  className={`w-16 h-16 rounded-full object-cover`}
                />} */}
                <h2>{investor.investorFirmName || investor.name}</h2>
                <h3 className="text-center cg-text-brand">{investor.subDescription}</h3>
                {!investor.investorFirmName && !!investor.description && <h3 className="cg-text-lg-500 text-center cg-text-secondary">{investor.description}</h3>}
              </div>
              <span className='cg-text-lg-400 text-center'>{investor.text}</span>
            </div>
            {investor.investorFirmName && <div className='flex flex-col items-center gap-2'>
              <img
                src={investor.logo}
                alt={`${investor.name} logo`}
                className={`h-12 ${investor.logoNoRounding ? '' : 'rounded-full w-12'} object-cover`}
              />
              <h3 className="text-center">{investor.name}</h3>
              <span className='cg-text-lg-400 text-center cg-text-secondary'>{investor.description}</span>
            </div>}
          </div>
        </div>)
      })}
      {showLeftArrow && (
        <ArrowLeftCircleIcon
          className='absolute left-5 top-1/2 transform -translate-y-1/2 w-16 h-16 cursor-pointer'
          onClick={() => handleScroll('left')}
        />
      )}
      {showRightArrow && (
        <ArrowRightCircleIcon
          className='absolute right-5 top-1/2 transform -translate-y-1/2 w-16 h-16 cursor-pointer'
          onClick={() => handleScroll('right')}
        />
      )}
    </div>
  );
};

export default React.memo(TokenSaleInvestors);
