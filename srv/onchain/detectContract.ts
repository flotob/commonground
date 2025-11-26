// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { ethers, toBeHex } from "ethers";
import detectProxyTarget from "./detectProxy";
import { OnchainPriority } from "./scheduler";
import {
  IERC165_abi,
  IERC20_abi,
  IERC721_abi,
  IERC1155_abi,
  IERC1155MetadataURI_abi,
} from "./abis";
import ethereumApi from "./ethereumApi";

const ERC165_interface = new ethers.Interface(IERC165_abi); 
const ERC20_interface = new ethers.Interface(IERC20_abi);
const ERC721_interface = new ethers.Interface(IERC721_abi);
const ERC1155_interface = new ethers.Interface(IERC1155_abi);
const ERC1155MetadataURI_interface = new ethers.Interface(IERC1155MetadataURI_abi);

function getInterfaceId(_interface: ethers.Interface) {
  let ident = BigInt(0);
  _interface.fragments.forEach(f => {
    const keccak = ethers.keccak256(ethers.toUtf8Bytes(f.format('sighash')));
    const fnIdent = BigInt(keccak.slice(0,10));
    ident = ident ^ fnIdent;
  });
  return ethers.toBeHex(ident, 4);
}

// ERC165
const ERC165_supportHash = getInterfaceId(ERC165_interface)

// ERC20
const ERC20_supportHash = getInterfaceId(ERC20_interface)
const ERC20_sighashes = ERC20_interface.fragments.map((f) => ERC20_interface.getFunction(f.format('sighash'))!.selector.slice(2));

// ERC721
const ERC721_supportHash = getInterfaceId(ERC721_interface);
const ERC721_sighashes = ERC721_interface.fragments.map((f) => ERC721_interface.getFunction(f.format('sighash'))!.selector.slice(2));

// ERC1155
const ERC1155_supportHash = getInterfaceId(ERC1155_interface);
const ERC1155_metadata_supportHash = '0x0e89341c'; // used a string because ERC1155MetadataURI_interface has the ERC1155 functions in it, which will "break" hash calculation
const ERC1155_sighashes = ERC1155_interface.fragments.map((f) => ERC1155_interface.getFunction(f.format('sighash'))!.selector.slice(2));
const ERC1155_metadata_sighashes = ERC1155MetadataURI_interface.fragments.map((f) => ERC1155MetadataURI_interface.getFunction(f.format('sighash'))!.selector.slice(2));

// LSP 7 + LSP 8
// Lukso interface ids are not calculated according to ERC165 standard,
// using them as magic numbers from https://docs.lukso.tech/contracts/interface-ids/
const LSP7_supportHashes = ["0xb3c4928f", "0xc52d6008"];
const LSP8_supportHash = "0x3a271706";

type ContractDetectionResult = {
  type: Models.Contract.OnchainData["type"];
  isErc20?: boolean;
  isErc721?: boolean;
  isErc1155?: boolean;
  isErc1155MetadataURI?: boolean;
  isLsp7?: boolean;
  isLsp8?: boolean;
  isErc165: boolean;
} | null;

export default async function detectContractType(
  chain: Models.Contract.ChainIdentifier,
  contractAddress: Common.Address,
  priority: OnchainPriority,
): Promise<ContractDetectionResult> {
  // check ERC165 capability
  let isErc165 = false;
  try {
    const erc165response = await ethereumApi.requestData('ERC_165_contract.supportsInterface', {
      chain,
      contractAddress,
      interfaceHash: ERC165_supportHash,
      priority,
      retry: false,
    });
    isErc165 = erc165response.result;
  } catch (e) {}

  // contract implements ERC165 and can be queried for supported interfaces
  if (isErc165) {
    try {
      const erc20response = await ethereumApi.requestData('ERC_165_contract.supportsInterface', {
        chain,
        contractAddress,
        interfaceHash: ERC20_supportHash,
        priority,
        retry: false,
      });
      if (erc20response.result === true) {
        return {
          type: "ERC20",
          isErc20: true,
          isErc165: true,
        };
      }

      const erc721response = await ethereumApi.requestData('ERC_165_contract.supportsInterface', {
        chain,
        contractAddress,
        interfaceHash: ERC721_supportHash,
        priority,
        retry: false,
      });
      if (erc721response.result === true) {
        return {
          type: "ERC721",
          isErc721: true,
          isErc165: true,
        };
      }

      const erc1155response = await ethereumApi.requestData('ERC_165_contract.supportsInterface', {
        chain,
        contractAddress,
        interfaceHash: ERC1155_supportHash,
        priority,
        retry: false,
      });
      if (erc1155response.result === true) {
        const erc1155metadataresponse = await ethereumApi.requestData('ERC_165_contract.supportsInterface', {
          chain,
          contractAddress,
          interfaceHash: ERC1155_metadata_supportHash,
          priority,
          retry: false,
        });
        return {
          type: "ERC1155",
          isErc1155: true,
          isErc165: true,
          isErc1155MetadataURI: erc1155metadataresponse.result,
        };
      }

      for (const LSP7_supportHash of LSP7_supportHashes) {
        const lsp7response = await ethereumApi.requestData('ERC_165_contract.supportsInterface', {
          chain,
          contractAddress,
          interfaceHash: LSP7_supportHash,
          priority,
          retry: false,
        });
        if (lsp7response.result === true) {
          return {
            type: "LSP7",
            isLsp7: true,
            isErc165: true,
          };
        }
      }

      const lsp8response = await ethereumApi.requestData('ERC_165_contract.supportsInterface', {
        chain,
        contractAddress,
        interfaceHash: LSP8_supportHash,
        priority,
        retry: false,
      });
      if (lsp8response.result === true) {
        return {
          type: "LSP8",
          isLsp8: true,
          isErc165: true,
        };
      }
    } catch (e) {
      console.error(`Error in contract detection for ${contractAddress}: ${(e as any)?.message || "Unknown"}`)
    }
  }

  // contract does not support ERC165 and has to be investigated
  let result: ContractDetectionResult = null;
  let proxyTarget: Common.Address | null = null;

  const checkByteCode: (address: any) => Promise<ContractDetectionResult> = async (address: any) => {
    // get code and search for sighashes
    const { result: bytecode } = await ethereumApi.requestData('getCode', {
      chain,
      contractAddress: address,
      priority,
      retry: false,
    });

    if (ERC20_sighashes.every(sh => bytecode.indexOf(sh) > -1)) {
      return {
        type: "ERC20",
        isErc20: true,
        isErc165: false,
      };
    }
    if (ERC721_sighashes.every(sh => bytecode.indexOf(sh) > -1)) {
      return {
        type: "ERC721",
        isErc721: true,
        isErc165: false,
      };
    }
    if (ERC1155_sighashes.every(sh => bytecode.indexOf(sh) > -1)) {
      const erc1155metadataresult = ERC1155_metadata_sighashes.every(sh => bytecode.indexOf(sh) > -1);
      return {
        type: "ERC1155",
        isErc1155: true,
        isErc165: false,
        isErc1155MetadataURI: erc1155metadataresult,
      };
    }
    return null;
  }
  
  try {
    result = await checkByteCode(contractAddress);
  } catch (e) {
    console.error(`Error in contract detection for ${contractAddress}: ${(e as any)?.message || "Unknown"}`)
  }
  
  if (!result) {
    try {
      proxyTarget = await detectProxyTarget(chain, contractAddress, priority);
      if (!!proxyTarget) {
        result = await checkByteCode(proxyTarget);
      }
    }
    catch (e) {
      console.error(`Error in contract proxy detection for ${contractAddress}${proxyTarget !== null ? ` =p=> ${proxyTarget}` : ""}: ${(e as any)?.message || "Unknown"}`)
    }
  }

  console.log(`${contractAddress}${proxyTarget !== null ? ` =p=> ${proxyTarget}` : ""}: ERC165 Support: ${isErc165 ? "Yes" : "No"}, deep detection, result: ${result}`);
  return result;
}