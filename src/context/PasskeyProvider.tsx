// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useMemo, useState } from 'react';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import connectionManager from 'data/appstate/connection';
import { randomString } from '../util';
import urlConfig from '../data/util/urls';
import webSocketManager from 'data/appstate/webSocket';
import errors from 'common/errors';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

type PasskeyProcessStatus = 'idle' | 'waitForWebsocket' | 'executing';

type PasskeyState = {
    passkeysSupported: boolean;
    createPasskey: (timeout?: number) => Promise<boolean>;
    loginWithPasskey: (timeout?: number) => Promise<boolean>;
    status: PasskeyProcessStatus;
    error?: string;
};

export const PasskeyContext = React.createContext<PasskeyState>({
    passkeysSupported: false,
    createPasskey: async () => false,
    loginWithPasskey: async () => false,
    status: 'idle',
});

export function PasskeyProvider(props: React.PropsWithChildren<{}>) {
    const { isMobile } = useWindowSizeContext();
    const [status, setStatus] = useState<PasskeyProcessStatus>('idle');
    const [error, setError] = useState<string | undefined>();
    const passkeysSupported = useMemo(() => browserSupportsWebAuthn(), []);

    const passkeyAction = useCallback((action: 'create' | 'login', timeout = 60_000) => {
        if (status === 'idle') {
            setStatus('executing');
            const requestId = randomString(20);
            let timeoutId: any = undefined;
            let handled = false;

            let resolve: (value: boolean | PromiseLike<boolean>) => void;
            let reject: (reason?: any) => void;
            const promise = new Promise<boolean>((_resolve, _reject) => {
                resolve = _resolve;
                reject = _reject;
            });

            const executeAction = () => {
                let features: string | undefined;
                if (!isMobile) {
                    const x = window.screen.width / 2 - 300;
                    const y = window.screen.height / 2 - 230;
                    features = "width=600,height=460,left=" + x + ",top=" + y;
                }
                const win = window.open(`${urlConfig.CGID_URL}/${action}/${requestId}`, "cgPassportSignWindow", features);
                if (win) {
                    let checkWindowClosedInterval = setInterval(() => {
                        if (win.closed) {
                            clearInterval(checkWindowClosedInterval);
                            setTimeout(() => {
                                if (!handled) {
                                    handlingFinished();
                                    reject?.(new Error("Cancelled by user"));
                                }
                            }, 200);
                        }
                    }, 200);
                }
            };

            const webSocketStateListener = (webSocketState: Common.WebSocketState) => {
                if (webSocketState === "connected") {
                    executeAction();
                    // Todo: potentially keep the listener to handle connection loss
                    // during the signature process? Should be an edge case though.
                    connectionManager.removeListener("webSocketStateChange", webSocketStateListener);
                }
            };

            const passkeyResultListener = (event: Events.CgId.SignResponse, fromWindowPostMessage = false) => {
                if (event.frontendRequestId === requestId) {
                    const { success, error } = event.data;
                    if (success === false && error !== undefined) {
                        setError(error);
                    }

                    console.log(`Passkey result received (by ${fromWindowPostMessage ? 'post message' : 'websocket'})`, event.data);
                    handlingFinished();
                    resolve?.(success);
                }
            };

            const passkeyResultPostMessageListener = function (this: Window, event: MessageEvent<Events.CgId.SignResponse>) {
                if (event?.data?.type !== "cliCgIdSignResponse") {
                    return;
                }
                passkeyResultListener(event.data, true);
            };

            const handlingFinished = () => {
                handled = true;
                if (timeoutId !== undefined) {
                    clearTimeout(timeoutId);
                    timeoutId = undefined;
                }
                connectionManager.unregisterClientEventHandler("cliCgIdSignResponse", passkeyResultListener);
                window.removeEventListener("message", passkeyResultPostMessageListener);
                connectionManager.removeListener("webSocketStateChange", webSocketStateListener);
                setStatus('idle');
            };

            timeoutId = setTimeout(() => {
                timeoutId = undefined;
                if (handled) {
                    return;
                }
                handlingFinished();
                reject?.(errors.client.TIMEOUT);
                console.error("Passkey: " + action + " timed out");
            }, timeout);

            connectionManager.registerClientEventHandler("cliCgIdSignResponse", passkeyResultListener);
            window.addEventListener("message", passkeyResultPostMessageListener)

            if (webSocketManager.state === "connected") {
                executeAction();
            }
            else {
                setStatus('waitForWebsocket');
                connectionManager.addListener("webSocketStateChange", webSocketStateListener);
                console.error("No active webSocket connection detected, waiting for connection...");
            }

            return promise;
        }
        else {
            throw new Error("Passkey action already in progress");
        }
    }, [status, isMobile]);

    const createPasskey = useMemo(() => {
        return (timeout?: number) => passkeyAction('create', timeout);
    }, [passkeyAction]);

    const loginWithPasskey = useMemo(() => {
        return (timeout?: number) => passkeyAction('login', timeout);
    }, [passkeyAction]);

    return (
        <PasskeyContext.Provider value={{
            passkeysSupported,
            createPasskey,
            loginWithPasskey,
            status,
            error,
        }}>
            {props.children}
        </PasskeyContext.Provider>
    )
}

export function usePasskeyContext() {
    const context = React.useContext(PasskeyContext);
    return context;
}