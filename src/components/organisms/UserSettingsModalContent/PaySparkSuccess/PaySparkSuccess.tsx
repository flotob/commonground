// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { CheckBadgeIcon } from '@heroicons/react/20/solid';
import Button from 'components/atoms/Button/Button';
import { useUserSettingsContext } from 'context/UserSettingsProvider';
import { SparkTile } from '../GetSpark/GetSpark';
import useLocalStorage from 'hooks/useLocalStorage';
import { useOwnUser } from 'context/OwnDataProvider';
import { UserPremiumFeatureName } from 'common/enums';

const PaySparkSuccess = () => {
  const { setCurrentPage } = useUserSettingsContext();
  const [sparkAmount] = useLocalStorage(0, "CHOSEN_SPARK_AMOUNT");
  const ownUser = useOwnUser();
  const premiumUser = ownUser?.premiumFeatures.some(feature => feature.featureName === UserPremiumFeatureName.SUPPORTER_1 || feature.featureName === UserPremiumFeatureName.SUPPORTER_2) || false;

  return (<div className='flex flex-col gap-4 items-center justify-center cg-text-main px-4 cg-text-lg-400'>
    <h2 className='cg-heading-2'>Your <span className='cg-text-spark'>Spark</span> is on the way</h2>
    <span className='text-center'>This can take a while while the Blockchain does its thing. You can close this window, we’ll let you know when it arrives!</span>

    <SparkTile
      spark={sparkAmount}
      price={sparkAmount / 1000}
      successTile
    />
    <span className='cg-text-secondary cg-text-md-400'>Thanks for supporting Common Ground. We couldn’t do it without you.</span>
    <div className='flex flex-col gap-2 w-full'>
      {premiumUser && <Button
        className='w-full'
        iconLeft={<CheckBadgeIcon className='w-5 h-5' />}
        text='Become a CG Supporter'
        role='primary'
      />}
      <Button
        className='w-full'
        text='Done'
        role='secondary'
        onClick={() => setCurrentPage('home')}
      />
    </div>
  </div>);
}

export default PaySparkSuccess