// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export enum StreamingDataType {
  CLIENT_AUTH = 0,
  CLIENT_JOINED = 1,
  CLIENT_LEFT = 2,
  CLIENT_KEY = 3,
  CLIENT_MUTED = 6,

  SERVER_ACCEPTED = 4,
  SERVER_DENIED = 5,

  AUDIO_PCM = 10,
}

/**
 * STREAMING DATA TYPES
 * All binary types start with 1 byte for the dataType
 * 
 * CLIENT AUTH
 * session id (32 bytes)
 * 
 * CLIENT JOINED
 * talker id (2 bytes)
 * 
 * CLIENT LEFT
 * talker id (2 bytes)
 * 
 * CLIENT KEY
 * when sending: target talker id (2 bytes)
 * when receiving: sender talker id (2 bytes)
 * iv (16 bytes)
 * client key (variable)
 * 
 * SERVER ACCEPTED
 * uint16 array of talker ids (2*n bytes variable length)
 * 
 * SERVER DENIED
 * error (encoded string, variable bytes)
 * 
 * AUDIO_PCM
 * server managed talker id (2 bytes)
 * iv (16 bytes)
 * encrypted audio data (8 bytes firstSample + variable length)
 * 
 */