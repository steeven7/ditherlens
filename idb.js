const DB_NAME = 'ditherlens-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      db.createObjectStore('notes', { keyPath: 'id' });
      db.createObjectStore('queue', { autoIncrement: true });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// NOTES
export async function saveNote(note) {
  const db = await openDB();
  const tx = db.transaction('notes', 'readwrite');
  tx.objectStore('notes').put(note);
}

export async function getNotes() {
  const db = await openDB();
  return new Promise(resolve => {
    const req = db.transaction('notes').objectStore('notes').getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

// QUEUE
export async function queueRequest(data) {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  tx.objectStore('queue').add(data);
}

export async function flushQueue(sendFn) {
  const db = await openDB();
  const store = db.transaction('queue', 'readwrite').objectStore('queue');

  store.openCursor().onsuccess = async e => {
    const cursor = e.target.result;
    if (!cursor) return;

    try {
      await sendFn(cursor.value);
      store.delete(cursor.key);
    } catch {}

    cursor.continue();
  };
}
