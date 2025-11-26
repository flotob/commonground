// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import useLocalStorage from "hooks/useLocalStorage";
import React, { useCallback, useEffect, useState } from "react";

interface CallDevicesState {
    selectedAudioDevice?: string;
    selectedWebCam?: string;
    availableAudioDevices: MediaDeviceInfo[];
    availableWebCams: MediaDeviceInfo[];
    chooseAudioDevice: (deviceId: string) => void;
    chooseWebcamDevice: (deviceId: string) => void;
    updateDevices: () => Promise<void>;
}

export const CallDevicesContext = React.createContext<CallDevicesState>({
    availableAudioDevices: [],
    availableWebCams: [],
    chooseAudioDevice: () => { },
    chooseWebcamDevice: () => { },
    updateDevices: async () => { return Promise.resolve(); },
});

const getAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
    //get audio devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(d => d.kind === "audioinput");
    const filteredAudioDevices = audioDevices.filter(d => d.deviceId !== "");
    return filteredAudioDevices || [];
}

const getVideoDevices = async (): Promise<MediaDeviceInfo[]> => {
    //get video devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");
    const filteredVideoDevices = videoDevices.filter(d => d.deviceId !== "");
    return filteredVideoDevices || [];
}

export function CallDevicesProvider(props: React.PropsWithChildren<{}>) {

    const [selectedAudioDevice, setSelectedAudioDevice] = useLocalStorage('', 'selectedAudioDeviceId');
    const [selectedWebCam, setSelectedWebCam] = useLocalStorage('', 'selectedVideoDeviceId');
    const [availableAudioDevices, setAvailableAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [availableWebCams, setAvailableWebCams] = useState<MediaDeviceInfo[]>([]);

    const updateDevices = useCallback(async () => {
        const audioDevices = await getAudioDevices();
        const videoDevices = await getVideoDevices();
        setAvailableAudioDevices(audioDevices);
        setAvailableWebCams(videoDevices);
        if (selectedWebCam === '' && videoDevices.length > 0) {
            setSelectedWebCam(videoDevices[0].deviceId);
        }
        if (selectedAudioDevice === '' && audioDevices.length > 0) {
            setSelectedAudioDevice(audioDevices[0].deviceId);
        }
        if (selectedAudioDevice !== '' && !audioDevices.find(d => d.deviceId === selectedAudioDevice)) {
            setSelectedAudioDevice(audioDevices[0].deviceId);
        }
        if (selectedWebCam !== '' && !videoDevices.find(d => d.deviceId === selectedWebCam)) {
            setSelectedWebCam(videoDevices[0].deviceId);
        }
    }, [selectedAudioDevice, selectedWebCam, setSelectedAudioDevice, setSelectedWebCam]);
    
    useEffect(() => {
        updateDevices();
    }, [updateDevices]);

    const chooseAudioDevice = useCallback((deviceId: string) => {
        const device = availableAudioDevices.find(d => d.deviceId === deviceId);
        if (device) {
            setSelectedAudioDevice(device.deviceId);
        }
    }, [availableAudioDevices, setSelectedAudioDevice]);

    const chooseWebcamDevice = useCallback((deviceId: string) => {
        const device = availableWebCams.find(d => d.deviceId === deviceId);
        if (device) {
            setSelectedWebCam(device.deviceId);
        }
    }, [availableWebCams, setSelectedWebCam]);


    return (
        <CallDevicesContext.Provider value={{ availableAudioDevices, availableWebCams, selectedAudioDevice, selectedWebCam, chooseAudioDevice, chooseWebcamDevice, updateDevices }}>
            {props.children}
        </CallDevicesContext.Provider>
    )
}

export function useCallDevicesContext() {
    const context = React.useContext(CallDevicesContext);
    return context;
}