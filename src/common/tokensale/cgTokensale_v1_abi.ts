// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

const cgTokensale_v1_abi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "beneficiary_",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner_",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "allowanceSigner_",
                "type": "address"
            },
            {
                "internalType": "uint48",
                "name": "startTimestamp_",
                "type": "uint48"
            },
            {
                "internalType": "uint48",
                "name": "endTimestamp_",
                "type": "uint48"
            },
            {
                "internalType": "uint208",
                "name": "hardcap_",
                "type": "uint208"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "BeneficiaryTransferFailed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ECDSAInvalidSignature",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "length",
                "type": "uint256"
            }
        ],
        "name": "ECDSAInvalidSignatureLength",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
            }
        ],
        "name": "ECDSAInvalidSignatureS",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "HardcapMustBeGreaterThanTotalInvested",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "HardcapMustBeGreaterThanZero",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidAllowanceSignature",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NoDirectDepositsAllowed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "OnlyFutureEndTimestampAllowed",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "PaymentTooSmall",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ReentrancyGuardReentrantCall",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "RefundTransferFailed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "SaleHasEnded",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "SaleHasNotStarted",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "SaleIsFull",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "StartTimestampMustBeBeforeEndTimestamp",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ZeroAddressForbidden",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes16",
                "name": "userId",
                "type": "bytes16"
            },
            {
                "indexed": false,
                "internalType": "uint208",
                "name": "investedAmount",
                "type": "uint208"
            },
            {
                "indexed": false,
                "internalType": "uint208",
                "name": "saleProgressBefore",
                "type": "uint208"
            },
            {
                "indexed": false,
                "internalType": "uint48",
                "name": "investmentId",
                "type": "uint48"
            },
            {
                "indexed": false,
                "internalType": "uint48",
                "name": "timestamp",
                "type": "uint48"
            }
        ],
        "name": "Investment",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "inputs": [],
        "name": "allowanceSigner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "beneficiary",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "endTimestamp",
        "outputs": [
            {
                "internalType": "uint48",
                "name": "",
                "type": "uint48"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "hardcap",
        "outputs": [
            {
                "internalType": "uint208",
                "name": "",
                "type": "uint208"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes16",
                "name": "userId",
                "type": "bytes16"
            },
            {
                "internalType": "bytes",
                "name": "allowanceSignature",
                "type": "bytes"
            }
        ],
        "name": "invest",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "investmentId",
        "outputs": [
            {
                "internalType": "uint48",
                "name": "",
                "type": "uint48"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "paginationBlocksBy1000",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newAllowanceSigner",
                "type": "address"
            }
        ],
        "name": "setAllowanceSigner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newBeneficiary",
                "type": "address"
            }
        ],
        "name": "setBeneficiary",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint208",
                "name": "newHardcap",
                "type": "uint208"
            }
        ],
        "name": "setHardcap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint48",
                "name": "newStartTimestamp",
                "type": "uint48"
            },
            {
                "internalType": "uint48",
                "name": "newEndTimestamp",
                "type": "uint48"
            }
        ],
        "name": "setStartAndEndTimestamp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "startTimestamp",
        "outputs": [
            {
                "internalType": "uint48",
                "name": "",
                "type": "uint48"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalInvested",
        "outputs": [
            {
                "internalType": "uint208",
                "name": "",
                "type": "uint208"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
] as const;

export default cgTokensale_v1_abi;