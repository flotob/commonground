// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export const IERC165_abi = [
  "function supportsInterface(bytes4 interfaceId) external view returns (bool)"
];

// ERC 20
export const IERC20_abi = [
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];
export const IERC20Metadata_abi = [
  ...IERC20_abi,
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "function decimals() external view returns (uint8)"
];
export const IERC20Metadata_abi_with_events = [
  ...IERC20Metadata_abi,
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ERC 721
export const IERC721_abi = [
  "function balanceOf(address owner) external view returns (uint256 balance)",
  "function ownerOf(uint256 tokenId) external view returns (address owner)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function approve(address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool _approved) external",
  "function getApproved(uint256 tokenId) external view returns (address operator)",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)"
];
export const IERC721Metadata_abi = [
  ...IERC721_abi,
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)"
];
export const IERC721Metadata_abi_with_events = [
  ...IERC721Metadata_abi,
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
];

// ERC 1155
export const IERC1155_abi = [
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address account, address operator) external view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external",
  "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external"
];
export const IERC1155MetadataURI_abi = [
  ...IERC1155_abi,
  "function uri(uint256 id) external view returns (string memory)"
];
export const IERC1155MetadataURI_abi_with_events = [
  ...IERC1155MetadataURI_abi,
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event ApprovalForAll(address indexed account, address indexed operator, bool approved)",
  "event URI(string value, uint256 indexed id)"
];

// --- LUKSO ---

// ERC 173
export const IERC173_abi = [
  "function owner() external view returns (address)",
  "function transferOwnership(address newOwner) external",
  "function renounceOwnership() external",
];
export const IERC173_abi_with_events = [
  ...IERC173_abi,
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
];

// ERC 725Y
export const IERC725Y_abi = [
  "function getData(bytes32 dataKey) external view returns (bytes memory value)",
  "function setData(bytes32 dataKey, bytes memory value) external",
  "function getDataBatch(bytes32[] memory dataKeys) external view returns (bytes[] memory values)",
  "function setDataBatch(bytes32[] memory dataKeys, bytes[] memory values) external",
];
export const IERC725Y_abi_with_events = [
  ...IERC725Y_abi,
  "event DataChanged(bytes32 indexed dataKey, bytes dataValue)",
];

// LSP 7
export const ILSP7_abi = [
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address tokenOwner) external view returns (uint256)",
  "function authorizeOperator(address operator, uint256 amount, bytes memory operatorNotificationData) external",
  "function revokeOperator(address to, bool notify, bytes memory operatorNotificationData) external",
  "function increaseAllowance(address operator, uint256 addedAmount, bytes memory operatorNotificationData) external",
  "function decreaseAllowance(address operator, uint256 subtractedAmount, bytes memory operatorNotificationData) external",
  "function authorizedAmountFor(address operator, address tokenOwner) external view returns (uint256)",
  "function getOperatorsOf(address tokenOwner) external view returns (address[] memory)",
  "function transfer(address from, address to, uint256 amount, bool force, bytes memory data) external",
  "function transferBatch(address[] memory from, address[] memory to, uint256[] memory amount, bool[] memory force, bytes[] memory data) external",
  "function batchCalls(bytes[] memory data) external returns (bytes[] memory results)",
];
export const ILSP7_abi_with_events = [
  ...ILSP7_abi,
  "event Transfer(address indexed operator, address indexed from, address indexed to, uint256 amount, bool force, bytes data)",
  "event OperatorAuthorizationChanged(address indexed operator, address indexed tokenOwner, uint256 indexed amount, bytes operatorNotificationData)",
  "event OperatorRevoked(address indexed operator, address indexed tokenOwner, bool indexed notified, bytes operatorNotificationData)",
];
export const LSP7_abi = [
  ...IERC173_abi_with_events,
  ...IERC725Y_abi_with_events,
  ...ILSP7_abi_with_events,
];

// LSP 8
export const ILSP8_abi = [
  "function getDataForTokenId(bytes32 tokenId, bytes32 dataKey) external view returns (bytes memory dataValue)",
  "function setDataForTokenId(bytes32 tokenId, bytes32 dataKey, bytes memory dataValue) external",
  "function getDataBatchForTokenIds(bytes32[] memory tokenIds, bytes32[] memory dataKeys) external view returns (bytes[] memory dataValues)",
  "function setDataBatchForTokenIds(bytes32[] memory tokenIds, bytes32[] memory dataKeys, bytes[] memory dataValues) external",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address tokenOwner) external view returns (uint256)",
  "function tokenOwnerOf(bytes32 tokenId) external view returns (address)",
  "function tokenIdsOf(address tokenOwner) external view returns (bytes32[] memory)",
  "function authorizeOperator(address operator, bytes32 tokenId, bytes memory operatorNotificationData) external",
  "function revokeOperator(address operator, bytes32 tokenId, bool notify, bytes memory operatorNotificationData) external",
  "function isOperatorFor(address operator, bytes32 tokenId) external view returns (bool)",
  "function getOperatorsOf(bytes32 tokenId) external view returns (address[] memory)",
  "function transfer(address from, address to, bytes32 tokenId, bool force, bytes memory data) external",
  "function transferBatch(address[] memory from, address[] memory to, bytes32[] memory tokenId, bool[] memory force, bytes[] memory data) external",
  "function batchCalls(bytes[] memory data) external returns (bytes[] memory results)",
];
export const ILSP8_abi_with_events = [
  ...ILSP8_abi,
  "event Transfer(address operator, address indexed from, address indexed to, bytes32 indexed tokenId, bool force, bytes data)",
  "event OperatorAuthorizationChanged(address indexed operator, address indexed tokenOwner, bytes32 indexed tokenId, bytes operatorNotificationData)",
  "event OperatorRevoked(address indexed operator, address indexed tokenOwner, bytes32 indexed tokenId, bool notified, bytes operatorNotificationData)",
  "event TokenIdDataChanged(bytes32 indexed tokenId, bytes32 indexed dataKey, bytes dataValue)",
];
export const LSP8_abi = [
  ...IERC173_abi_with_events,
  ...IERC725Y_abi_with_events,
  ...ILSP8_abi_with_events,
];

// CG Community
export const CGCommunity_abi = [
  "function adminOf(uint256 id) external view returns (address)",
  "function levelOf(uint256 id) external view returns (uint256)",
  "function featuresOf(uint256 id) external view returns (uint256)",
];