// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import dayjs, { Dayjs } from "dayjs";

export const RECENT_REACTIONS_WINDOW_SECONDS = 5;

export interface RoomConsumer {
	id: string;
	type: string;
	locallyPaused: boolean;
	remotelyPaused: boolean;
	rtpParameters: any;
	spatialLayers: any;
	temporalLayers: any;
	preferredSpatialLayer: any;
	preferredTemporalLayer: any;
	currentSpatialLayer?: any;
	currentTemporalLayer?: any;
	priority: number;
	codec: any;
	track: MediaStreamTrack | null;
	kind: string;
	score?: number;
}

export interface RoomProducer {
	id: string;
	paused: boolean;
	track: MediaStreamTrack | null;
	rtpParameters: any;
	codec: any;
	score?: number;
	locallyPaused?: boolean;
	remotelyPaused?: boolean;
	deviceLabel?: string;
	type?: string;
}

export interface Reaction { reactionTime: number, reaction: string, peerId?: string };

export interface RoomPeer {
	id: string,
	displayName: string,
	device: any,
	consumers: string[]
	isMe: boolean;
	volume: number;
	priority: number;
	webcamEnabled?: boolean;
	sharingEnabled?: boolean;
	isTalking: boolean;
	lastEventTime: number;
	isHandRaised: boolean;
	isBroadcaster: boolean;
	reaction?: Reaction;
}

export interface Me {
	id: string,
	displayName: string,
	device: any,
	canSendMic: boolean;
	canSendWebcam: boolean;
	canChangeWebcam: boolean;
	webcamInProgress: boolean;
	shareInProgress: boolean;
	webcamEnabled: boolean;
	sharingEnabled: boolean;
	isBroadcaster: boolean;
	isHandRaised: boolean;
}

export type CallState = {
	call: Models.Calls.Call | null;
	callId: string;
	callName: string;
	callDescription: string | null;
	communityId: string;
	startTime: Dayjs;
	peers: Map<string, RoomPeer>;
	state: string;
	consumers: Map<string, RoomConsumer>;
	producers: Map<string, RoomProducer>;
	activeSpeaker: string;
	me: Me;
	isConnected: boolean;
	isMuted: boolean;
	spotlightedPeer?: string;
	spotlightedPeerOriginator?: string;
	broadcasters: Map<string, RoomPeer>;
	raisedHands: Map<string, RoomPeer>;
	recentReactions: (Reaction & {peerId: string})[];
	audioOnly: boolean;
	highQuality: boolean;
	callSlots: number;
	stageSlots: number;
}

export const meInitialState = {
	audioMuted: false,
	canChangeWebcam: false,
	canSendMic: false,
	canSendWebcam: false,
	device: null,
	displayName: '',
	id: '',
	shareInProgress: false,
	webcamInProgress: false,
	webcamEnabled: false,
	sharingEnabled: false,
	isBroadcaster: false,
	isHandRaised: false
};
export const initialState: CallState = {
	call: null,
	callId: '',
	callName: '',
	callDescription: '',
	communityId: '',
	startTime: dayjs(),
	peers: new Map(),
	state: 'disconnected',
	consumers: new Map(),
	producers: new Map(),
	activeSpeaker: '',
	isConnected: false,
	isMuted: true,
	me: meInitialState,
	broadcasters: new Map(),
	raisedHands: new Map(),
	recentReactions: [],
	audioOnly: false,
	highQuality: false,
	callSlots: 0,
	stageSlots: 0
}

export type initializeCallPayload = { 
	call: Models.Calls.Call, 
	callId: string; 
	user: RoomPeer, 
	callDescription: string | null, 
	callName: string, 
	startTime: Dayjs, 
	communityId: string, 
	isMuted: boolean, 
	audioOnly: boolean, 
	highQuality: boolean,
	callSlots: number,
	stageSlots: number
 }

export type Action =
	| { type: "initializeCall"; payload: initializeCallPayload }
	| { type: "initializeBroadcast"; payload: { peers: RoomPeer[], broadcasters: string[], handsRaised: string[] } }
	| { type: "addUsers"; payload: RoomPeer[] }
	| { type: "removeUser"; payload: string }
	| { type: "exitCall" }
	| { type: "setRoomState"; payload: string }
	| { type: "addConsumer"; payload: { consumer: RoomConsumer; peerId: string } }
	| { type: "removeConsumer"; payload: string }
	| { type: "removeConsumerFromPeer"; payload: { consumerId: string; peerId: string } }
	| { type: "setConsumerResumed"; payload: { consumerId: string; originator: string } }
	| { type: "setConsumerPaused"; payload: { consumerId: string; originator: string } }
	| { type: "setConsumerCurrentLayers"; payload: { consumerId: string; spatialLayer: number; temporalLayer: number } }
	| { type: "setConsumerPreferredLayers"; payload: { consumerId: string; spatialLayer: number; temporalLayer: number } }
	| { type: "setConsumerScore"; payload: { consumerId: string; score: number } }
	| { type: "setConsumerPriority"; payload: { consumerId: string; priority: number } }
	| { type: "addProducer"; payload: { producer: RoomProducer; id: string } }
	| { type: "removeProducer"; payload: string }
	| { type: "setProducerPaused"; payload: string }
	| { type: "setProducerResumed"; payload: string }
	| { type: "setProducerScore"; payload: { producerId: string; score: number } }
	| { type: "setRoomActiveSpeaker"; payload: { peerId: string, volume: number } }
	| { type: "setRoomDominantSpeaker"; payload: string }
	| { type: "setCanChangeWebcam"; payload: boolean }
	| { type: "setMediaCapabilities"; payload: { canSendMic: boolean; canSendWebcam: boolean } }
	| { type: 'setWebcamInProgress', payload: boolean }
	| { type: 'setShareInProgress', payload: boolean }
	| { type: "toggleMuted" }
	| { type: "setIsWebcamOn"; payload: boolean }
	| { type: "setProducerTrack", payload: { producerId: string; track: MediaStreamTrack } }
	| { type: "setPeerSpotlight"; payload: { peerId: string; originator: string } }
	| { type: "setIsTalking"; payload: { peerId: string; isTalking: boolean } }
	| { type: "raiseHand"; peerId: string }
	| { type: "lowerHand"; peerId: string }
	| { type: "promoteBroadcaster"; peerId: string }
	| { type: "demoteBroadcaster"; peerId: string }
	| { type: "addReaction"; payload: { peerId: string; reaction: string } }
	| { type: "clearReactions"; }
	| { type: "updateCallConfigs"; payload: { callSlots: number, stageSlots: number, audioOnly: boolean; highQuality: boolean } };

export function callReducer(state: CallState, action: Action): CallState {
	switch (action.type) {
		case "initializeCall":
			const { call, callId, user, callDescription, callName, communityId, startTime, isMuted, audioOnly, highQuality, callSlots, stageSlots } = action.payload;
			const newPeers = new Map(state.peers);
			newPeers.set(user.id, { ...user, isMe: true });
			const meObj = {
				...user,
				id: user.id,
				displayName: user.displayName,
				device: user.device,
				canSendMic: false,
				canSendWebcam: false,
				canChangeWebcam: false,
				webcamInProgress: false,
				shareInProgress: false,
				webcamEnabled: false,
				sharingEnabled: false,
				isBroadcaster: call.callCreator === user.id,
				isHandRaised: false,
			};
			return { ...state, call, callId, peers: newPeers, callName, callDescription, communityId, startTime, isConnected: true, isMuted, state: "connected", audioOnly, highQuality, callSlots, stageSlots, me: meObj };
		case "initializeBroadcast": {
			const { peers, broadcasters, handsRaised } = action.payload;
			const allPeers = new Map(state.peers);
			const broadcasterSet = new Set(broadcasters);
			const raisedHandSet = new Set(handsRaised);
			const broadcasterMap = new Map();
			const raisedHandMap = new Map();
			for (const newUser of peers) {
				newUser.priority = 1;
				const isBroadcaster = broadcasterSet.has(newUser.id);
				const isHandRaised = raisedHandSet.has(newUser.id);
				allPeers.set(newUser.id, { ...newUser, isBroadcaster, isHandRaised, consumers: []  });
			}
			for (const broadcaster of broadcasters) {
				const peer = allPeers.get(broadcaster);
				if (peer) {
					broadcasterMap.set(broadcaster, peer);
				}
			}
			for (const raisedHand of handsRaised) {
				const peer = allPeers.get(raisedHand);
				if (peer) {
					raisedHandMap.set(raisedHand, peer);
				}
			}
			return { ...state, peers: allPeers, broadcasters: broadcasterMap, raisedHands: raisedHandMap };
		}
		case "addUsers": {
			const peers = new Map(state.peers);
			for (const newUser of action.payload) {
				newUser.priority = 1;
				peers.set(newUser.id, newUser);
			}
			return { ...state, peers };
		}
		case "removeUser": {
			const userId = action.payload;
			let peers = state.peers;
			if (peers.has(userId)) {
				peers = new Map(peers);
				peers.delete(userId);
			}
			let broadcasters = state.broadcasters;
			if (broadcasters.has(userId)) {
				broadcasters = new Map(broadcasters);
				broadcasters.delete(userId);
			}
			let raisedHands = state.raisedHands;
			if (raisedHands.has(userId)) {
				raisedHands = new Map(raisedHands);
				raisedHands.delete(userId);
			}
			return { ...state, peers, broadcasters, raisedHands };
		}
		case "exitCall":
			return { ...initialState };
		case "setRoomState":
			const newState = action.payload;
			return { ...state, state: newState };
		case "addConsumer": {
			const { consumer, peerId } = action.payload;
			const peer = state.peers.get(peerId);
			let updatedPeer;
			if (peer) {
				const consumerExists = peer.consumers.find((peerConsumer) => peerConsumer === consumer.id);
				updatedPeer = {
					...peer,
					consumers: consumerExists ? peer.consumers : [...peer.consumers, consumer.id],
					priority: consumer.kind === 'video' ? 1 : consumer.kind === 'share' ? 2 : peer.priority,
					webcamEnabled: consumer.kind === 'video' ? true : peer.webcamEnabled,
					sharingEnabled: consumer.kind === 'share' ? true : peer.sharingEnabled
				};
			}
			const peersToUpdate = new Map(state.peers);
			if (updatedPeer) {
				peersToUpdate.set(peerId, updatedPeer);
			}
			const updatedConsumers = new Map(state.consumers);
			updatedConsumers.set(consumer.id, consumer);
			return { ...state, consumers: updatedConsumers, peers: peersToUpdate };
		}
		case "removeConsumerFromPeer": {
			const { consumerId: consumerIdToRemove, peerId: peerIdToRemoveFrom } = action.payload;
			const consumerKind = state.consumers.get(consumerIdToRemove)?.kind;
			const peerToRemoveFrom = state.peers.get(peerIdToRemoveFrom);
			let updatedPeer;
			if (peerToRemoveFrom) {
				const filteredConsumers = peerToRemoveFrom.consumers.filter((consumerId) => consumerId !== consumerIdToRemove);
				updatedPeer = { ...peerToRemoveFrom, consumers: filteredConsumers, priority: 1 };
				if (consumerKind === 'video') {
					updatedPeer.webcamEnabled = false;
				} else if (consumerKind === 'share') {
					updatedPeer.sharingEnabled = false;
				}
			}
			const peersToRemoveConsumer = new Map(state.peers);
			if (updatedPeer) {
				peersToRemoveConsumer.set(peerIdToRemoveFrom, updatedPeer);
			}
			const filteredConsumers = new Map(state.consumers);
			if (filteredConsumers.has(consumerIdToRemove)) {
				filteredConsumers.delete(consumerIdToRemove);
			}
			return { ...state, consumers: filteredConsumers, peers: peersToRemoveConsumer };
		}
		case "setConsumerResumed": {
			const { consumerId: consumerIdToResume, originator: originatorOfResume } = action.payload;
			const updatedConsumersToResume = new Map(state.consumers);
			const consumerToResume = state.consumers.get(consumerIdToResume);
			let updatedConsumer;
			if (consumerToResume) {
				updatedConsumer = { ...consumerToResume };
				if (originatorOfResume === 'local') {
					updatedConsumer.locallyPaused = false;
				} else {
					updatedConsumer.remotelyPaused = false;
				}
				updatedConsumersToResume.set(consumerIdToResume, updatedConsumer);
			}
			return { ...state, consumers: updatedConsumersToResume };
		}
		case "setConsumerPaused": {
			const { consumerId: consumerIdToPause, originator: originatorOfPause } = action.payload;
			const updatedConsumersToPause = new Map(state.consumers);
			const consumerToPause = state.consumers.get(consumerIdToPause);
			let updatedConsumer;
			if (consumerToPause) {
				updatedConsumer = { ...consumerToPause };
				if (originatorOfPause === 'local') {
					updatedConsumer.locallyPaused = true;
				} else {
					updatedConsumer.remotelyPaused = true;
				}
				updatedConsumersToPause.set(consumerIdToPause, updatedConsumer);
			}
			return { ...state, consumers: updatedConsumersToPause };
		}
		case "setConsumerCurrentLayers":
			const { consumerId: consumerIdToSetCurrentLayers, spatialLayer, temporalLayer } = action.payload;
			const consumerToSetCurrentLayers = state.consumers.get(consumerIdToSetCurrentLayers);
			if (consumerToSetCurrentLayers) {
				consumerToSetCurrentLayers.currentSpatialLayer = spatialLayer;
				consumerToSetCurrentLayers.currentTemporalLayer = temporalLayer;
			}
			return { ...state };
		case "setConsumerPreferredLayers":
			const { consumerId: consumerIdToSetPreferredLayers, spatialLayer: preferredSpatialLayer, temporalLayer: preferredTemporalLayer } = action.payload;
			const consumerToSetPreferredLayers = state.consumers.get(consumerIdToSetPreferredLayers);
			if (consumerToSetPreferredLayers) {
				consumerToSetPreferredLayers.preferredSpatialLayer = preferredSpatialLayer;
				consumerToSetPreferredLayers.preferredTemporalLayer = preferredTemporalLayer;
			}
			return { ...state };
		case "setConsumerScore":
			const { consumerId: consumerIdToSetScore, score } = action.payload;
			const consumerToSetScore = state.consumers.get(consumerIdToSetScore);
			if (consumerToSetScore) {
				consumerToSetScore.score = score;
			}
			return { ...state };
		case "setConsumerPriority":
			const { consumerId: consumerIdToSetPriority, priority } = action.payload;
			const consumerToSetPriority = state.consumers.get(consumerIdToSetPriority);
			if (consumerToSetPriority) {
				consumerToSetPriority.priority = priority;
			}
			return { ...state };
		case "addProducer": {
			const { producer: originalProducer, id } = action.payload;
			const updatedProducer = { ...originalProducer, locallyPaused: !originalProducer.track?.enabled };
			const updatedProducers = new Map(state.producers);
			updatedProducers.set(id, updatedProducer);
			let updatedMe = state.me;
			if (state.me) {
				updatedMe = { ...state.me };
				if (updatedProducer.type === 'front' || updatedProducer.type === 'back') {
					updatedMe.webcamEnabled = true;
				} else if (updatedProducer.type === 'share') {
					updatedMe.sharingEnabled = true;
				}
			}
			return { ...state, producers: updatedProducers, me: updatedMe };
		}
		case "removeProducer":
			const producerId = action.payload;
			const producerType = state.producers.get(producerId)?.type;
			const updatedMe = {
				...state.me,
				webcamEnabled: (producerType === 'front' || producerType === 'back') ? false : state.me.webcamEnabled,
				sharingEnabled: producerType === 'share' ? false : state.me.sharingEnabled
			};
			const filteredProducers = new Map(state.producers);
			filteredProducers.delete(producerId);
    		return { ...state, me: updatedMe, producers: filteredProducers };
		case "setProducerPaused": {
			const producerIdToPause = action.payload;
			const producerToPause = state.producers.get(producerIdToPause);
			let updatedProducers = new Map(state.producers);
			if (producerToPause) {
				const updatedProducer = { ...producerToPause, locallyPaused: true };
				updatedProducers.set(producerIdToPause, updatedProducer);
			}
			return { ...state, producers: updatedProducers };
		}
		case "setProducerResumed": {
			const producerIdToResume = action.payload;
			const originalProducerToResume = state.producers.get(producerIdToResume);
			if (originalProducerToResume) {
				const updatedProducerToResume = { ...originalProducerToResume, locallyPaused: false };
				const updatedProducers = new Map(state.producers);
				updatedProducers.set(producerIdToResume, updatedProducerToResume);
				return { ...state, producers: updatedProducers };
			}
			return { ...state };
		}
		case "setProducerScore":
			const { producerId: producerIdToSetScore, score: scoreToSet } = action.payload;
			const producerToSetScore = state.producers.get(producerIdToSetScore);
			if (producerToSetScore) {
				producerToSetScore.score = scoreToSet;
			}
			return { ...state };
		case "setRoomActiveSpeaker": {
			const peerIdToSetAsActiveSpeaker = action.payload.peerId;
			const peerVolume = action.payload.volume;
			const originalPeerToSetVolume = state.peers.get(peerIdToSetAsActiveSpeaker);
			if (originalPeerToSetVolume) {
				const updatedPeerToSetVolume = { ...originalPeerToSetVolume, volume: peerVolume };
				const updatedPeers = new Map(state.peers);
				updatedPeers.set(peerIdToSetAsActiveSpeaker, updatedPeerToSetVolume);
				return { ...state, peers: updatedPeers };
			}
			return { ...state };
		}
		case "setRoomDominantSpeaker":
			const dominantSpeakerPeerId = action.payload;
			console.log(dominantSpeakerPeerId);
			return { ...state, activeSpeaker: dominantSpeakerPeerId };
		case "setCanChangeWebcam":
			const canChangeWebcam = action.payload;
			const me = state.me;
			if (me) {
				me.canChangeWebcam = canChangeWebcam;
			}
			return { ...state };
		case "toggleMuted": {
			return { ...state, isMuted: !state.isMuted };
		}
		case "setWebcamInProgress": {
			const newState = action.payload;
			if (state.me) {
				const updatedMe = { ...state.me, webcamInProgress: newState };
				return { ...state, me: updatedMe };
			}
			return { ...state };
		}
		case "setShareInProgress": {
			const newState = action.payload;
			if (state.me) {
				const updatedMe = { ...state.me, shareInProgress: newState };
				return { ...state, me: updatedMe };
			}
			return { ...state };
		}
		case "setProducerTrack": {
			const { producerId, track } = action.payload;
			const producer = state.producers.get(producerId);
			let updatedProducers = new Map(state.producers);
			if (producer) {
				const updatedProducer = { ...producer, track: track };
				updatedProducers.set(producerId, updatedProducer);
			}
			return { ...state, producers: updatedProducers };
		}
		case "setPeerSpotlight": {
			const { peerId, originator } = action.payload;
			if (originator === 'remote') {
				return { ...state, spotlightedPeer: peerId, spotlightedPeerOriginator: originator };
			} else {
				if (state.spotlightedPeerOriginator === 'remote') {
					return { ...state }
				} else {
					return { ...state, spotlightedPeer: peerId, spotlightedPeerOriginator: originator };
				}
			}
		}
		case "setIsTalking": {
			const { peerId, isTalking } = action.payload;
			const originalPeer = state.peers.get(peerId);
			if (originalPeer) {
				const updatedPeer = { ...originalPeer, isTalking: isTalking, lastEventTime: Date.now() };
				const updatedPeers = new Map(state.peers);
				updatedPeers.set(peerId, updatedPeer);
				return { ...state, peers: updatedPeers };
			}
			return { ...state };
		}
		case "raiseHand": {
			const handRaisedId = action.peerId;
			const originalPeer = state.peers.get(handRaisedId);
			const updatedPeers = new Map(state.peers);
			if (originalPeer) {
				const updatedPeer = { ...originalPeer, isHandRaised: true };
				updatedPeers.set(handRaisedId, updatedPeer);
			}
			let updatedMe = state.me;
			if (state.me.id === handRaisedId) {
				updatedMe = { ...state.me, isHandRaised: true };
			}
			return { ...state, peers: updatedPeers, me: updatedMe };
		}
		case "lowerHand": {
			const handLoweredId = action.peerId;
			const originalPeer = state.peers.get(handLoweredId);
			const updatedPeers = new Map(state.peers);
			if (originalPeer) {
				const updatedPeer = { ...originalPeer, isHandRaised: false };
				updatedPeers.set(handLoweredId, updatedPeer);
			}
			const updatedRaisedHands = new Map(state.raisedHands);
			updatedRaisedHands.delete(handLoweredId);
			let updatedMe = state.me;
			if (state.me.id === handLoweredId) {
				updatedMe = { ...state.me, isHandRaised: false };
			}
			return { ...state, peers: updatedPeers, raisedHands: updatedRaisedHands, me: updatedMe };
		}
		case "promoteBroadcaster": {
			const promotedPeerId = action.peerId;
			const peer = state.peers.get(promotedPeerId);
			let newPeers = new Map(state.peers);
			let newBroadcasters = new Map(state.broadcasters);
			let newMe = { ...state.me };
		  
			if (peer) {
			  const newPeer = { ...peer, isBroadcaster: true };
			  newPeers.set(promotedPeerId, newPeer);
			  newBroadcasters.set(promotedPeerId, newPeer);
			}
		  
			if (state.me.id === promotedPeerId) {
			  newMe = { ...state.me, isBroadcaster: true, isHandRaised: false };
			}
		  
			return { ...state, peers: newPeers, broadcasters: newBroadcasters, me: newMe };
		  }

		case "demoteBroadcaster": {
			const demotedPeerId = action.peerId;
			const peer = state.peers.get(demotedPeerId);
			let newPeers = new Map(state.peers);
			let newBroadcasters = new Map(state.broadcasters);
			let newMe = { ...state.me };
			
			if (peer) {
				const newPeer = { ...peer, isBroadcaster: false };
				newPeers.set(demotedPeerId, newPeer);
				newBroadcasters.delete(demotedPeerId);
			}
			
			if (state.me.id === demotedPeerId) {
				newMe = { 
				...state.me, 
				isBroadcaster: false, 
				sharingEnabled: false, 
				webcamEnabled: false 
				};
				state = { ...state, isMuted: true };
			}
		
			return { ...state, peers: newPeers, broadcasters: newBroadcasters, me: newMe };
		}

		case "addReaction": {
			const { peerId, reaction } = action.payload;
			const peer = state.peers.get(peerId);
			const now = Date.now();
			const newReaction = { reactionTime: now, reaction };
			if (peer) {	
				peer.reaction = newReaction;
			}
			const peers = new Map(state.peers);

			const recentReactions = state.recentReactions.filter(rr => dayjs(rr.reactionTime).add(RECENT_REACTIONS_WINDOW_SECONDS, 's').isAfter(now));
			recentReactions.push({...newReaction, peerId})

			return { ...state, peers, recentReactions };
		}
		
		case "clearReactions": {
			state.peers.forEach(peer => peer.reaction = undefined);
			const peers = new Map(state.peers);			

			return { ...state, peers, recentReactions: [] };
		}

		case "updateCallConfigs": {
			const { audioOnly, highQuality, callSlots, stageSlots } = action.payload;
			return { ...state, audioOnly, highQuality, callSlots, stageSlots };
		}

		default:
			return state;
	}
}