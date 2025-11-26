// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

const DEVICE_IDB_IDENT = "CG_DEVICE_KEY_IDENT";

type IDBKeyPairObject = {
  userId: string,
  deviceId: string,
  keyPair: CryptoKeyPair
}

export async function generateNewKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-384"
    },
    false,
    ["sign"]
  );
}

async function getKeyPairDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open(DEVICE_IDB_IDENT, 1);
    openRequest.onerror = (ev) => {
      console.error("Error opening key database", ev);
      reject(openRequest.error);
    };
    openRequest.onsuccess = (ev) => {
      const db = openRequest.result;
      resolve(db);
    };
    openRequest.onupgradeneeded = (ev) => {
      openRequest.result.createObjectStore(DEVICE_IDB_IDENT, { keyPath: "deviceId" });
    };
  });
}

export async function getDeviceKeyPair(deviceId: string): Promise<IDBKeyPairObject> {
  const db = await getKeyPairDatabase();

  const keyPair = await new Promise<IDBKeyPairObject>((resolve, reject) => {
    const getTransaction = db.transaction(DEVICE_IDB_IDENT, "readonly");
    const objectStore = getTransaction.objectStore(DEVICE_IDB_IDENT);
    const getRequest = objectStore.get(deviceId);
    getRequest.onerror = (ev) => {
      console.error("Error getting key object", ev);
      reject(getRequest.error);
    };
    getRequest.onsuccess = async (ev) => {
      let obj: IDBKeyPairObject = getRequest.result;
      if (obj) {
        console.log("Found existing device key pair in IDB");
        resolve(obj);
      } else {
        reject(new Error("KeyPair not found"))
      }
    };
  });

  db.close();
  return keyPair;
}

export async function getAllDeviceKeyPairs(): Promise<IDBKeyPairObject[]> {
  const db = await getKeyPairDatabase();

  const keyPairs = await new Promise<IDBKeyPairObject[]>((resolve, reject) => {
    const getTransaction = db.transaction(DEVICE_IDB_IDENT, "readonly");
    const objectStore = getTransaction.objectStore(DEVICE_IDB_IDENT);
    const getRequest = objectStore.getAll();
    getRequest.onerror = (ev) => {
      console.error("Error getting key object", ev);
      reject(getRequest.error);
    };
    getRequest.onsuccess = async (ev) => {
      let objs: IDBKeyPairObject[] = getRequest.result;
      if (objs) {
        console.log(`Found ${objs.length} existing device key pairs in IDB`);
        resolve(objs);
      } else {
        reject(new Error("No KeyPairs found"))
      }
    };
  });

  db.close();
  return keyPairs;
}

export async function saveDeviceKeyPair(userId: string, deviceId: string, keyPair: CryptoKeyPair): Promise<void> {
  const db = await getKeyPairDatabase();

  await new Promise<void>((resolve, reject) => {
    const obj: IDBKeyPairObject = {
      userId,
      deviceId,
      keyPair
    };
    const putTransaction = db.transaction(DEVICE_IDB_IDENT, "readwrite");
    const objectStore = putTransaction.objectStore(DEVICE_IDB_IDENT);
    const clearRequest = objectStore.clear();
    clearRequest.onerror = (ev) => {
      console.error("Error clearing object store", ev);
      reject(clearRequest.error);
    };
    clearRequest.onsuccess = (ev) => {
      const putRequest = objectStore.put(obj);
      putRequest.onerror = (ev) => {
        // ToDo: is indexeddb available e.g. in Firefox Private Windows?
        // CLient would just fail connecting otherwise.
        console.error("Error putting key object", ev);
        reject(putRequest.error);
      };
      putRequest.onsuccess = (ev) => {
        console.log("New device key pair saved to IDB")
        resolve();
      };
    };
  });

  db.close();
}

export async function deleteDeviceKeyPair(deviceId: string): Promise<void> {
  const db = await getKeyPairDatabase();

  await new Promise<void>((resolve, reject) => {
    const deleteTransaction = db.transaction(DEVICE_IDB_IDENT, "readwrite");
    const objectStore = deleteTransaction.objectStore(DEVICE_IDB_IDENT);
    const putRequest = objectStore.delete(deviceId)
    putRequest.onerror = (ev) => {
      // ToDo: is indexeddb available e.g. in Firefox Private Windows?
      // CLient would just fail connecting otherwise.
      console.error("Error deleting object", ev);
      reject(putRequest.error);
    };
    putRequest.onsuccess = (ev) => {
      console.log("Device key pair deleted from IDB")
      resolve();
    };
  });

  db.close();
}

export async function signApiSecret(deviceId: string, secret: string) {
  const keyPairObj = await getDeviceKeyPair(deviceId);
  const encoder = new TextEncoder();
  const signature_arrayBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: "SHA-384"
    },
    keyPairObj.keyPair.privateKey as any,
    encoder.encode(secret)
  );
  const uint8arr = new Uint8Array(signature_arrayBuffer);
  const base64Signature = btoa(String.fromCharCode(...Array.from(uint8arr)));
  const result: API.Socket.login.Request = {
    secret,
    base64Signature,
    deviceId
  };
  return result;
}