// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import type config from './config';
import type {
  getSignableSecret,
} from './templates';

type FractalData = {
  approvedAt: number;
  validUntil: number;
  address: Address;
  fractalId: string;
  proof: string;
};

// GENERAL TYPES
type Address = `0x${string}`;

// USER

type LinkedAddress = {
  message: {
    ownerId: string;
    linkedAddress: Address;
    signedChainId: number;
  };
  signature: string;
  ownerAccountChanged?: string;
  visibility: "private" | "followed" | "public";
};

type InitialAmounts = {
  blogs: number;
  communities: number;
  communityContents: number;
};

type AppData = {
  id: string;
  groupOrder: string[];
  conversations: Conversation[];
  linkedAddresses: LinkedAddress[];
  onboardingComplete: boolean;
  newsletterEmail?: string;
  newsletterSubscribed?: boolean;
  unreadNotificationCount: number;
  initialAmounts: InitialAmounts;
};

type UserData = {
  id: string;
  status: OnlineStatus | 'offline';
  alias: string | null;
  imageId: string | null;
  description: string;
  twitter: string;
  homepage: string;
  links: string[];
  verified: boolean;
  blogCreator: boolean;
};

type UserInfo = {
  description: string;
  twitter?: string;
  homepage?: string;
  links?: string[];
}

type UserProfile = {
  info: UserInfo;
  infoSignature: string;
  linkedAddresses: LinkedAddress[];
};

type UserDataStore = {
  [id: string]: UserData;
};


// GROUPS & CHANNELS

type ChannelType = 'text' | 'voice';
type AccessLevel = 'user' | 'moderator' | 'admin' | 'editor';
type AreaLocked = 'pending' | 'locked' | 'unlocked';
type AreaWritePermission = 'everyone' | 'team+did' | 'teamonly';
type CommunitySortingTypes = 'new' | 'popular'

type GroupMember = {
  id: string;
  accesslevel: AccessLevel;
};

type CommunityLink = {
  url: string;
  text: string;
}

type CommunityTag = {
  text: string;
  value: string;
}

type GroupInfo = {
  title: string;
  description: string;
  imageId?: string;
  headerImageId?: string;
  links?: CommunityLink[];
  tags?: string[];
  created?: string;
  shortDescription?: string;
};

type Group = {
  id: string;
  info: GroupInfo;
  areas: Area[];
  members: GroupMember[];
  blockedUsers: {
    id: string;
    blockstate: 'mute' | 'banned';
    until: string | null;
  }[];
  ownerId: string;
  createdAt: Date;
  verified: boolean;
};

type Area = {
  id: string; // groupId 10 alphanumeric, e.g. aD123tZUda. AreaId: groupId + 4 alphanumeric digits. channelId: areaId + 4 alphanumeric digits 
  title: string;
  order: number;
  channels: Channel[];
  members: string[];
  accessrules: AccessRules | null;
  locked: AreaLocked;
  writableBy: AreaWritePermission;
};

type ReducedArea = Omit<Area, 'members' | 'channels'>;

type ChannelInfo = {
  emoji: string;
  description: string;
}

type Channel = {
  id: string;
  name: string;
  channelInfo: ChannelInfo;
  order: number;
  lastRead: string | null;
  unread?: number;
} & ({
  type: 'text';
} | {
  type: 'voice';
  talkers: {
    [userId: string]: number;
  }
  mutedTalkers?: {
    [userId: string]: number;
  }
});

type GatingRuleERC20 = {
  type: 'ERC20';
  contractId: string;
  amount: string;
};

type GatingRuleERC721 = {
  type: 'ERC721';
  contractId: string;
  amount: string;
};

type GatingRuleERC1155 = {
  type: 'ERC1155';
  contractId: string;
  tokenId: string;
  amount: string;
};

type GatingRule = GatingRuleERC20 | GatingRuleERC721 | GatingRuleERC1155;

type AccessRules = {
  rule1: GatingRule;
} | {
  rule1: GatingRule;
  rule2: GatingRule;
  logic: "and"|"or";
};

type ReducedGroup = Omit<Group, 'members' | 'areas'> & {
  memberCount: number;
  areas: ReducedArea[];
};

type ReducedVoiceChannel = {
  community: {
    id: string;
    info: GroupInfo;
    members: GroupMember[];
    areas: {
      [address: Address]: ReducedArea;
    }
  };
  channel: {
    id: string;
    name: string;
    talkers: {
        [id: string]: number;
    }
    mutedTalkers?: {
      [id: string]: number;
    }
    isTokenGated?: boolean;
  }
}


type Conversation = {
  userId: string;
  lastRead: string | null;
  unread: number;
  allRetrieved: boolean;
  lastMessage?: Direct.Message;
};

// ARTICLES

type ArticleState = 'published' | 'draft';
type ArticleVisibility = 'public' | 'community' | 'areas';
type ArticleType = 'article' |'announcement' | 'guide';

type ArticleContentV1 = {
  version: '1';
  text: string;
};

type ArticleContentType =
  TextContentType |
  NewlineContentType |
  LinkContentType |
  RichTextLinkContentType |
  HeaderContentType |
  ArticleImageContentType |
  ArticleEmbedContentType;

type ArticleContentV2 = {
  version: '2';
  content: ArticleContentType[];
};

type ArticleContent = ArticleContentV1 | ArticleContentV2;

type Article = {
  id: string;
  groupId: string;
  headerImageId: string;
  thumbnailImageId: string;
  title: string;
  content: ArticleContent;
  state: ArticleState;
  visibility: ArticleVisibility;
  creatorId: string;
  published: Date | null;
  areaIds: string[];
  type: ArticleType;
  tags: string[];
};

type ArticleData = Omit<Article, 'id'|'groupId'>;
type ReducedCommunityContent = Omit<Article, 'content'|'state'|'headerImageId'|'thumbnailImageId'> & {
  previewText: string;
  previewImageId: string;
};

// BLOGS

type BlogState = 'published' | 'draft';
type BlogType = 'all' |'followings';

type Blog = {
  id: string;
  headerImageId: string;
  thumbnailImageId: string;
  title: string;
  content: ArticleContent;
  state: BlogState;
  creatorId: string;
  published: Date | null;
  tags: string[];
};

type BlogData = Omit<Blog, 'id'>;

// EVENTS

type EventClickData = {
  type: 'ChannelMessage';
  channelId: string;
  postId: string;
} | {
  type: 'DM'
};

const notificationTypes = ['Announcement', 'Airdrop', 'Article', 'DM', 'Event', 'New Follower', 'Mention', 'Reminder', 'Reply'] as const;
export type NotificationType = typeof notificationTypes[number];

type Event = {
  id: string;
  type: NotificationType;
  owner: string;
  text: string;
  subjectUser?: string;
  subjectGroup?: string;
  clickData?: EventClickData;
  created: string;
  read: boolean;
}

// ONCHAIN & KEYS

type ChainIdentifier = keyof typeof config["AVAILABLE_CHAINS"];
type ContractType = "ERC20"|"ERC721"|"ERC1155";

type ERC721Data = {
  type: "ERC721";
  name: string;
  symbol: string;
};
type ERC20Data = {
  type: "ERC20";
  name: string;
  symbol: string;
  decimals: number;
};
type ERC1155Data = {
  type: "ERC1155";
};

type ContractData = {
  id: string;
  address: Address;
  chain: ChainIdentifier;
  data: ERC20Data | ERC721Data | ERC1155Data;
};

type KeyStorage = {
  b64salt: string;
  b64iv: string;
  ecdhPublic: any;
  ecdhPrivate: string;
};


// COMMUNICATION

type WsConnectData = {
  onlineStatus: OnlineStatus;
};


// SIGNATURES

type SignableSecret = ReturnType<typeof getSignableSecret>;

type SignedData<T> = {
  data: T;
  signature: string;
};


// SERVER DATA TYPES FOR CLIENT EVENTS

type ReducedChannel = Omit<Channel, 'access'|'name'> & {
  access?: never;
  name?: never;
};


// CLIENT EVENTS

type OnlineStatus = 'online' | 'away' | 'dnd' | 'invisible';

type CliAppDataChange = {
  type: 'cli_app_data_change';
  data: Partial<AppData>;
};

type CliUserDataChange = {
  type: 'cli_user_data_change';
  data: Partial<UserData> & {userId: string};
};

type CliNewMessage = {
  type: 'cli_new_message';
  data: EncryptedMessage;
  conversationCreated?: boolean;
};

type CliMessageChange = {
  type: 'cli_message_change';
  data: EncryptedMessage;
};

type CliMessageDeleted = {
  type: 'cli_message_deleted';
  from: string;
  to: string;
  id: string;
};

type CliConversationChange = {
  type: 'cli_conversation_change';
} & ({
  action: 'update';
  userId: string;
  lastRead: string | null;
  unread?: number;
  navigate?: boolean;
} | {
  action: 'remove';
  userId: string;
});

type CliGroupBlocksChange = {
  type: 'cli_groupblocks_change';
  groupId: string;
  userId: string;
  action: 'mute' | 'banned' | 'relieve';
  until?: string;
  deleteAllPosts?: true;
};

type CliNewPost = {
  type: 'cli_new_post';
  data: Post;
};

type CliPostChange = {
  type: 'cli_post_change';
  data: Post;
}

type CliPostDeleted = {
  type: 'cli_post_deleted';
  channelId: string;
  id: string;
};

type CliPostsDeleted = {
  type: 'cli_posts_deleted';
  deleted: {
    channelId: string;
    postId: string;
  }[];
};

type CliReactionChange = {
  type: 'cli_reaction_change';
  target: ({
    id: string;
    type: 'message';
    from: string;
    to: string;
  } | {
    id: string;
    type: 'post';
    channelId: string;
  });
  reaction: Reaction;
  action: 'set' | 'unset';
};

type CliGroupChange = {
  type: 'cli_group_change';
  groupId: string;
  info?: GroupInfo;
  verified?: boolean;
};

type CliAreaChange = {
  type: 'cli_area_change';
} & ({
  action: 'update';
  data: (Partial<Area> & { id: string; })
} | {
  action: 'delete';
  data: { id: string; };
});

type CliChannelChange = {
  type: 'cli_channel_change';
} & ({
  action: 'update';
  data: (Partial<Channel> & { id: string; });
} | {
  action: 'delete';
  data: { id: string; };
});

type CliGroupJoinSelf = {
  type: 'cli_group_join_self';
  group: Group;
  userData: UserData[];
  navigate: boolean;
};

type CliGroupLeaveSelf = {
  type: 'cli_group_leave_self';
  groupId: string;
  reason?: string;
};

type CliGroupMemberChange = {
  type: 'cli_group_member_change';
  groupId: string;
} & ({
  userData: UserData;
  accesslevel: AccessLevel;
  action: 'join';
} | {
  id: string;
  action: 'leave';
} | {
  id: string;
  action: 'accesslevel';
  accesslevel: AccessLevel;
});

type CliAreaMemberChange = {
  type: 'cli_area_member_change';
  areaId: string;
  action: 'join' | 'leave';
  member: string;
};

type CliChannelJoinSelf = {
  type: 'cli_channel_join_self';
  channelId: string;
  data: ({
    type: 'voice';
    talkers: (Channel & {type: 'voice'})['talkers'];
  } | {
    type: 'text';
  });
};

type CliStreamChannelMember = {
  type: 'cli_stream_channel_member';
  action: 'join' | 'leave';
  channelId: string;
  talkerId: number;
  userId: string;
  members?: {
    [userId: string]: number;
  };
  personalEvent?: true;
  thisSession?: boolean;
};

type CliStreamChannelError = {
  type: 'cli_stream_channel_error';
  channelId: string;
  reason: string;
};

type CliFollowChanged = {
  type: 'cli_follow_changed';
  myFollowers?: {
    add?: string[];
    remove?: string[];
  };
  followedByMe?: {
    add?: string[];
    remove?: string[];
  };
};

type CliNewNotification = {
  type: 'cli_new_notification';
  ownerId: string;
  event: Event;
}

type CliNotificationRead = {
  type: 'cli_notification_read';
  ownerId: string;
  notificationId: string;
}

type CliConnectionLost = {
  type: 'cli_connection_lost';
}

type CliConnectionRestored = {
  type: 'cli_connection_restored';
}

type ClientEvent = { sessionId?: never } & (
    CliAppDataChange
  | CliUserDataChange
  | CliNewMessage
  | CliMessageChange
  | CliConversationChange
  | CliNewPost
  | CliPostChange
  | CliGroupChange
  | CliChannelChange
  | CliGroupJoinSelf
  | CliGroupLeaveSelf
  | CliGroupMemberChange
  | CliGroupBlocksChange
  | CliChannelJoinSelf
  | CliStreamChannelMember
  | CliStreamChannelError
  | CliReactionChange
  | CliFollowChanged
  | CliAreaChange
  | CliAreaMemberChange
  | CliMessageDeleted
  | CliPostDeleted
  | CliPostsDeleted
  | CliNewNotification
  | CliNotificationRead
  | CliConnectionLost
  | CliConnectionRestored
);


// SERVER REQUEST DATA

type RequestInitialAmountOfPublicContent = {
  groupLimit: number;
};

type RequestDeletePostOrMessage = {
  id: string;
};

type RequestDeleteAllUserPosts = {
  userId: string;
  communityId: string;
};

type RequestSaveE2eeKeys = {
  priv: SignableKeyStorage["message"];
  privSig: string;
  pub: SignablePublicKey["message"];
  pubSig: string;
};

type RequestAddFractalID = {
  signature: string;
}

type RequestRemoveFractalID = {
  signature: string;
}

type RequestSaveUserInfo = SignedData<SignableUserInfo>;

type RequestSetGroupOrder = {
  sortedIds: string[];
};

type RequestStartConversation = {
  userId: string;
};

type RequestCloseConversation = {
  userId: string;
};

type RequestSetLastRead = {
  userId: string;
  lastRead: string;
};

type RequestSetOwnStatus = {
  status: OnlineStatus;
};

type RequestCreateLinkedAddress = {
  data: SignableLinkedAddress["message"];
  signature: string;
};

type RequestSetLinkedAddressVisibility = {
  linkedAddress: Address;
  visibility: LinkedAddress["visibility"];
};

type RequestDeleteLinkedAddress = {
  linkedAddress: Address;
};

type RequestCreateCommunity = {
  groupInfo: GroupInfo;
  logoBase64Content?: string;
  headerBase64Content?: string;
  nftId?: string;
};

type RequestCreateArea = {
  groupId: string;
  name: string;
  accessrules: AccessRules | null;
  order: number;
  writableby: AreaWritePermission;
};

type RequestUpdateArea = {
  areaId: string;
  name?: string;
  accessrules?: AccessRules | null;
  order?: number;
  writableby?: AreaWritePermission;
};

type RequestDeleteArea = {
  areaId: string;
};

type RequestCreateCommunityContent = {
  groupId: string;
  type: ArticleType;
  data: ArticleData;
};

type RequestUpdateCommunityContent = {
  groupId: string;
  articleId: string;
  data: Partial<ArticleData>;
};

type RequestPublishCommunityContent = {
  groupId: string;
  articleId: string;
};

type RequestDeleteCommunityContent = {
  groupId: string;
  articleId: string;
};

type RequestCreateBlog = {
  data: BlogData;
};

type RequestUpdateBlog = {
  blogId: string;
  data: Partial<BlogData>;
};

type RequestPublishBlog = {
  blogId: string;
};

type RequestDeleteBlog = {
  blogId: string;
};

type RequestUploadImage = {
  base64Content: string;
};

type RequestSetGroupInfo = {
  groupId: string;
  groupInfo: GroupInfo;
};

type RequestSetGroupNftId = {
  groupId: string;
  nftId: string;
};

type RequestUploadGroupImage = {
  groupId: string;
  base64Content: string;
};

type RequestCreateChannel = {
  areaId: string;
  channelType: ChannelType;
  name: string;
  channelInfo: ChannelInfo;
  order: number;
};

type RequestUpdateChannel = {
  channelId: string;
  name?: string;
  channelInfo?: ChannelInfo;
  order?: number;
};

type RequestUpdateChannelLastRead = {
  channelId: string;
  lastReadIsoDate: string;
};

type RequestDeleteChannel = {
  channelId: string;
};

type RequestJoinOrLeaveGroup = {
  groupId: string;
  action: 'join'|'leave';
  navigate: boolean;
};

type RequestJoinOrLeaveStreamChannel = {
  channelId: string;
  action: 'join'|'leave';
};

type RequestCreateNewPost = {
  signedData: SignedData;
  attachments: Attachment[];
};

type RequestGetGroup = {
  groupId: string;
};

type RequestLoadPosts = {
  channelId: string;
  before?: string;
};

type RequestLoadPostsFromId = {
  channelId: string;
  postId: string;
  before: boolean;
};

type RequestGetPostUpdates = {
  channelId: string;
  createdStart: string;
  createdEnd: string;
  updateFrom: string;
};

type RequestGetPostsByIds = {
  ids: string[];
  channelId: string;
};

type RequestLoadMessages = {
  userId: string;
  before?: string;
};

type RequestLoadMessagesFromId = {
  userId: string;
  messageId: string;
  before: boolean;
};

type RequestGetMessageUpdates = {
  userId: string;
  createdStart: string;
  createdEnd: string;
  updateFrom: string;
};

type RequestGetMessagesByIds = {
  ids: string[];
};

type RequestSetReaction = {
  itemId: string;
  reaction: string;
};

type RequestPublicKey = {
  userId: string;
};

type RequestLoadAllGroups = {
  offset: number;
  sort?: CommunitySortingTypes;
  tag?: string;
  limit?: number;
};

type RequestLoadCommunityContent = {
  offset: number;
  communityId?: string;
  state?: ArticleState;
  type?: ArticleType;
};

type RequestLoadCommunityContentById = {
  communityId: string;
  contentId: string;
};

type RequestMostUsedCommunityCohorts = {
}

type RequestLoadReducedCommunities = {
  userId: string;
}

type RequestLoadUserBlogs = {
  userId: string;
  offset: number;
  state?: BlogState;
}

type RequestLoadLatestUserBlog = {
  userId: string;
}

type RequestLoadBlogs = {
  offset: number;
  contentType: BlogType;
}

type RequestLoadBlogById = {
  contentId: string;
  draft?: true;
};

type RequestUserData = {
  userId: string;
};

type RequestContractData = {
  chain: ChainIdentifier;
  address: Address;
};

type RequestSetAlias = {
  alias: string;
};

type RequestUploadUserImage = {
  base64Content: string;
};

type RequestSetUserRole = {
  groupId: string;
  accesslevel: AccessLevel;
  userId: string;
};

type RequestContractDataByIds = {
  ids: string[];
};

type RequestSignedURL = {
  objectId: string;
};

type RequestFollow = {
  action: "add" | "remove";
  userId: string;
};

type RequestMuteOrBan = {
  action: "mute" | "banned" | "relieve";
  groupId: string;
  userId: string;
  durationInSeconds?: number;
  deleteAllPosts?: true;
};

type RequestSetChannelMutedState = {
  channelId: string;
  muted: boolean;
};

type RequestSubscribeNewsletter = {
  email: string;
};

type RequestUnsubscribeNewsletter = {
  email: string;
};

type RequestAddEmailContact = {
  email: string;
  withNewCommunitycreatedTag?: boolean;
};

type RequestLoadNotifications = {
  offset: number;
}

type RequestSetNotificationAsRead = {
  notificationId: string;
}

// SERVER RESPONSE DATA

type AjaxResponse<T> = {
  data?: T;
  error?: string;
  status: "OK"|"ERROR";
};

type ResponseLogin = {
  keyStorage: SignableKeyStorage["message"] | null;
  keyStorageSignature: string | null;
};

type ResponseInitialData = {
  groups: Group[];
  contracts: ContractData[];
  users: UserDataStore;
  appData: AppData;
};

type ResponseInitialAmountOfPublicContent = InitialAmounts;

type ResponsePublicKey = {
  message: SignablePublicKey['message'];
  signature: string;
};

type ResponseLoadPosts = {
  posts: Post[];
  allRetrieved: boolean;
};

type ResponseGetPostsByIds = {
  posts: Post[];
};

type ResponseGetPostUpdates = {
  posts: Post[];
  deleted: string[];
};

type ResponseLoadMessages = {
  messages: EncryptedMessage[];
  allRetrieved: boolean;
};

type ResponseGetMessagesByIds = {
  messages: EncryptedMessage[];
};

type ResponseGetMessageUpdates = {
  messages: EncryptedMessage[];
  deleted: string[];
};

type ResponseUploadArticleImage = {
  headerImageId: string;
  thumbnailImageId: string;
};

type ResponseUploadArticleContentImage = {
  imageId: string;
  largeImageId: string;
};

type ResponseUploadChannelAttachmentImage = {
  imageId: string;
  largeImageId: string;
};

type ResponseUserData = {
  data: UserData;
};

type ResponseLoadAllGroups = ReducedGroup[];

type ResponseGetGroup = ReducedGroup | null;

type ResponseLoadCommunityContent = Article[];

type ResponseLoadCommunityContentById = {
  ok: true;
  content: Article;
} | {
  ok: false;
  reason: 'communityGated';
} | {
  ok: false;
  reason: 'areaGated';
};

type ResponseLoadReducedCommunities = ReducedGroup[];

type ResponseMostUsedCommunityCohorts = string[];

type ResponseLoadBlogs = Blog[];

type ResponseLoadBlog = Blog;

type ResponseLoadNotifications = Event[];