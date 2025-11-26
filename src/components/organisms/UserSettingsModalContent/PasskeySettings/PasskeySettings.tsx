// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react'
import { PageType } from '../UserSettingsModalContent';
import './PasskeySettings.css';
import Button from 'components/atoms/Button/Button';
import { usePasskeyContext } from 'context/PasskeyProvider';
import { useOwnUser } from 'context/OwnDataProvider';
import dayjs from 'dayjs';

type Props = {
  setPage: (pageType: PageType) => void;
  lockModal: (lock: boolean) => void;
  closeModal: () => void;
};

const PasskeySettings: React.FC<Props> = (props) => {
  const { setPage, lockModal, closeModal } = props;
  const ownData = useOwnUser();
  const { passkeysSupported, createPasskey, status, error } = usePasskeyContext();
  const hasPasskeys = (ownData?.passkeys.length || 0) > 0;
  let buttonText = "Create passkey";
  if (!passkeysSupported) {
    buttonText = "Not supported";
  }
  if (status !== "idle") {
    buttonText = "Creating passkey...";
  }

  return (
    <div className="passkey-settings-root">
      <div className="mb-4">
        {hasPasskeys
          ? <>
            <div className="cg-text-md-500 cg-text-main">
              Your passkeys
            </div>
            {ownData?.passkeys.map((passkey) => (
              <div
                key={passkey.credentialID}
                className="mt-2 text-xs cg-text-main p-2 border border-gray-300 rounded-md"
              >
                Passkey {passkey.credentialID}<br/>
                Last signature {dayjs(passkey.updatedAt).format('YY-MM-DD HH:mm')}<br/>
                Created {dayjs(passkey.createdAt).format('YY-MM-DD HH:mm')}<br/>
                {passkey.credentialDeviceType}, {passkey.credentialBackedUp ? 'backed up' : 'NOT backed up'}
              </div>
            ))}
          </>
          : <div>
            No passkeys, start by creating one.
          </div>
        }
      </div>
      {!passkeysSupported && (
        <div className='cg-text-sm-400 cg-text-main'>
          Your current device does not support passkey creation.
        </div>
      )}
      <Button
        text={buttonText}
        onClick={() => createPasskey()}
        role="primary"
        className="w-full"
        disabled={status !== "idle" || !passkeysSupported}
      />
    </div>
  );
}





export default React.memo(PasskeySettings);