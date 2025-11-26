// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import errors from '../common/errors';
import settings from './settings';
require('isomorphic-fetch');

const schema: ERC725JSONSchema[] = [
  {
    name: 'LSP3Profile',
    key: '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
    keyType: 'Singleton',
    valueContent: 'VerifiableURI',
    valueType: 'bytes',
  }
];

export const isValidSignature = async (chain: Models.Contract.ChainIdentifier, request: any) => {
  const { address, signature, message } = request.data;
  const erc725 = new ERC725(schema, address, settings[chain].PROVIDER_URL);
  const result = await erc725.isValidSignature(message, signature);
  return result;
};

export const getUniversalProfileData = async (chain: Models.Contract.ChainIdentifier, request: { data: { address: Common.Address }}) => {
  const { address } = request.data;
  const erc725 = new ERC725(schema, address, settings[chain].PROVIDER_URL, {
    ipfsGateway: 'https://ipfs.io/ipfs/',
  });

  const fetchData = await erc725.fetchData('LSP3Profile').catch((error: any) => {
    console.error("Fetching universal profile data failed: ", error)
    throw new Error(errors.server.LUKSO_FETCH_FAILED);
  });

  let profileData: any = fetchData.value;
  if (!fetchData && !profileData) {
    throw new Error(errors.server.LUKSO_PROFILE_NOT_FOUND);
  }

  try {
    const returnObject = adjustData(profileData, address);
    return returnObject;
  } catch (error: any) {
    console.error("Universal profile was not in the intended format: ", error);
    throw new Error(errors.server.LUKSO_INVALID_FORMAT);
  }
};

function adjustData(profileData: any, upAddress: string) {
  const addressPrefix = upAddress.slice(2, 6);
  const updatedProfileName = profileData.LSP3Profile.name + `#${addressPrefix}`;
  const returnObject = {
    username: updatedProfileName,
    profileImageUrl: profileData.LSP3Profile.profileImage?.length > 0 ? profileData.LSP3Profile.profileImage[0].url as string : "",
    description: profileData.LSP3Profile.description as string,
  };
  return returnObject;
}
