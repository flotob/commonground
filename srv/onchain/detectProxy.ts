// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

// Taken from https://github.com/gnosis/ethers-proxies (MIT license)
// Modified to wait between requests

import { getAddress, BlockTag, toBeHex } from 'ethers'
import { OnchainPriority } from './scheduler'
import ethereumApi from './ethereumApi'

// obtained as bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
export const EIP_1967_LOGIC_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

// obtained as bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
export const EIP_1967_BEACON_SLOT =
  '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50'

// obtained as keccak256("org.zeppelinos.proxy.implementation")
export const OPEN_ZEPPELIN_IMPLEMENTATION_SLOT =
  '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3'

// obtained as keccak256("PROXIABLE")
export const EIP_1822_LOGIC_SLOT =
  '0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7'

export const EIP_1167_BEACON_ABI = [
  'function implementation() view returns (address)',

  // some implementations use this over the standard method name so that the beacon contract is not detected as an EIP-897 proxy itself
  'function childImplementation() view returns (address)',
]

export const EIP_897_ABI = [
  'function implementation() view returns (address)',
]

export const GNOSIS_SAFE_PROXY_ABI = [
  'function masterCopy() view returns (address)',
]

const detectProxyTarget = async (
  chain: Models.Contract.ChainIdentifier,
  proxyAddress: Common.Address,
  priority: OnchainPriority,
  blockTag?: BlockTag,
): Promise<Common.Address | null> => {
  const contractAddress = proxyAddress;
  // EIP-1967 direct proxy
  try {
    const { result: impl } = await ethereumApi.requestData('getStorage', {
      chain,
      contractAddress,
      position_bn: EIP_1967_LOGIC_SLOT,
      priority,
      retry: false,
    });
    const address = readAddress(impl);
    return address;
  } catch (e) {}

  // EIP-1967 beacon proxy
  try {
    const { result: beaconData } = await ethereumApi.requestData('getStorage', {
      chain,
      contractAddress,
      position_bn: EIP_1967_BEACON_SLOT,
      priority,
      retry: false,
    });
    const beaconAddress = readAddress(beaconData);
    let impl: string;
    try {
      const response = await ethereumApi.requestData('EIP_1167_beaconContract.implementation', {
        chain,
        contractAddress: beaconAddress,
        priority,
        blockTag,
        retry: false,
      });
      impl = response.result;
    } catch (e) {
      const response = await ethereumApi.requestData('EIP_1167_beaconContract.childImplementation', {
        chain,
        contractAddress: beaconAddress,
        priority,
        blockTag,
        retry: false,
      });
      impl = response.result;
    }
    const address = readAddress(impl);
    return address;
  } catch (e) {}

  // OpenZeppelin proxy pattern
  try {
    const response = await ethereumApi.requestData('getStorage', {
      chain,
      contractAddress,
      priority,
      position_bn: OPEN_ZEPPELIN_IMPLEMENTATION_SLOT,
      blockTag,
      retry: false,
    });
    const address = readAddress(response.result);
    return address;
  } catch (e) {}

  // EIP-1822 Universal Upgradeable Proxy Standard
  try {
    const response = await ethereumApi.requestData('getStorage', {
      chain,
      contractAddress,
      priority,
      position_bn: EIP_1822_LOGIC_SLOT,
      blockTag,
      retry: false,
    });
    const address = readAddress(response.result);
    return address;
  } catch (e) {}

  // EIP-1167 Minimal Proxy Contract
  try {
    const { result: bytecode } = await ethereumApi.requestData('getCode', {
      chain,
      contractAddress,
      priority,
      blockTag,
      retry: false,
    });
    const impl = parse1167Bytecode(bytecode);
    const address = readAddress(impl);
    return address;
  } catch (e) {}

  // EIP-897 DelegateProxy pattern
  try {
    const { result: impl } = await ethereumApi.requestData('EIP_897_contract.implementation', {
      chain,
      contractAddress,
      priority,
      blockTag,
      retry: false,
    });
    const address = readAddress(impl);
    return address;
  } catch (e) {}

  // GnosisSafeProxy contract
  try {
    const { result: impl } = await ethereumApi.requestData('GNOSIS_SAFE_PROXY_contract.masterCopy', {
      chain,
      contractAddress,
      priority,
      blockTag,
      retry: false,
    });
    const address = readAddress(impl);
    return address;
  } catch (e) {}

  return null;
}

const readAddress = (value: string) => {
  const number = BigInt(value);
  if (number === BigInt(0)) {
    throw new Error('empty slot');
  }
  return getAddress(toBeHex(number, 20)).toLowerCase() as Common.Address;
}

const EIP_1167_BYTECODE_PREFIX = '363d3d373d3d3d363d'
const EIP_1167_BYTECODE_SUFFIX = '57fd5bf3'
const parse1167Bytecode = (bytecode: string) => {
  const prefix = `0x${EIP_1167_BYTECODE_PREFIX}`
  if (
    !bytecode.startsWith(prefix) ||
    !bytecode.endsWith(EIP_1167_BYTECODE_SUFFIX)
  ) {
    throw new Error('Not an EIP-1167 bytecode')
  }

  // detect length of address (20 bytes non-optimized, 0 < N < 20 bytes for vanity addresses)
  const pushNHex = bytecode.substring(prefix.length, prefix.length + 2)
  // push1 ... push20 use opcodes 0x60 ... 0x73
  const addressLength = parseInt(pushNHex, 16) - 0x5f

  if (addressLength < 1 || addressLength > 20) {
    throw new Error('Not an EIP-1167 bytecode')
  }

  // extract address
  return `0x${bytecode.substring(
    prefix.length + 2,
    prefix.length + 2 + addressLength * 2 // address length is in bytes, 2 hex chars make up 1 byte
  )}`
}

export default detectProxyTarget;