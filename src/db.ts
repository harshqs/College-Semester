import { PDFDocument } from './types';

const DB_NAME = 'PDFSharePortalDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

// Set empty initial list of seeded documents to start with an elite, clean real-time index
const SEED_PDFS: PDFDocument[] = [];

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export function savePDF(doc: PDFDocument): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export function getAllPDFs(): Promise<PDFDocument[]> {
  return initDB().then((db) => {
    return new Promise<PDFDocument[]>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        let list = request.result || [];
        if (list.length === 0) {
          // Keep a temporary visual seed array if the active storage is blank, to make it beautiful right away!
          // We will write the SEED_PDFS into DB as well to make them editable.
          const seedTransaction = db.transaction([STORE_NAME], 'readwrite');
          const seedStore = seedTransaction.objectStore(STORE_NAME);
          SEED_PDFS.forEach((seedDoc) => {
            seedStore.put(seedDoc);
          });
          resolve(SEED_PDFS);
        } else {
          resolve(list);
        }
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export function deletePDF(id: string): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export function incrementDownloadCount(id: string): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const doc = getRequest.result as PDFDocument;
        if (doc) {
          doc.downloadCount = (doc.downloadCount || 0) + 1;
          const updateRequest = store.put(doc);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  });
}
