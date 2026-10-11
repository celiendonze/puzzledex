const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  // Si le body n'est pas FormData, ajouter application/json
  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorDetail = 'Une erreur est survenue';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// --- PUZZLES ---
export function getPuzzles(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  return request(`/puzzles?${query.toString()}`);
}

export function getPuzzle(id) {
  return request(`/puzzles/${id}`);
}

export function createPuzzle(data) {
  return request('/puzzles', { method: 'POST', body: data });
}

export function updatePuzzle(id, data) {
  return request(`/puzzles/${id}`, { method: 'PUT', body: data });
}

export function deletePuzzle(id) {
  return request(`/puzzles/${id}`, { method: 'DELETE' });
}

export function getBrands() {
  return request('/puzzles/meta/brands');
}

// --- ASSEMBLIES (RÉALISATIONS) ---
export function startNewAssembly(puzzleId, notes = null) {
  return request(`/puzzles/${puzzleId}/assemblies`, {
    method: 'POST',
    body: { notes },
  });
}

export function getAssemblies(puzzleId) {
  return request(`/puzzles/${puzzleId}/assemblies`);
}

export function updateAssembly(assemblyId, data) {
  return request(`/assemblies/${assemblyId}`, {
    method: 'PUT',
    body: data,
  });
}

export function deleteAssembly(assemblyId) {
  return request(`/assemblies/${assemblyId}`, { method: 'DELETE' });
}

// --- SESSIONS ---
export function createSession(assemblyId, data) {
  return request(`/assemblies/${assemblyId}/sessions`, {
    method: 'POST',
    body: data,
  });
}

export function updateSession(sessionId, data) {
  return request(`/sessions/${sessionId}`, {
    method: 'PUT',
    body: data,
  });
}

export function deleteSession(sessionId) {
  return request(`/sessions/${sessionId}`, { method: 'DELETE' });
}

// --- IMAGES ---
export function uploadImage(puzzleId, file, isCover = false) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('is_cover', isCover ? 'true' : 'false');
  return request(`/puzzles/${puzzleId}/images`, {
    method: 'POST',
    body: formData,
  });
}

export function setCoverImage(puzzleId, imageId) {
  return request(`/puzzles/${puzzleId}/cover/${imageId}`, {
    method: 'PUT',
  });
}

export function deleteImage(imageId) {
  return request(`/images/${imageId}`, { method: 'DELETE' });
}

// --- STATS ---
export function getStats() {
  return request('/stats');
}

// --- SAUVEGARDE & EXPORT ---
export const EXPORT_JSON_URL = '/api/backup/json';
export const EXPORT_DB_URL = '/api/backup/db';
export const EXPORT_ARCHIVE_URL = '/api/backup/archive';

export function importJson(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/backup/import/json', {
    method: 'POST',
    body: formData,
  });
}

export function importArchive(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/backup/import/archive', {
    method: 'POST',
    body: formData,
  });
}
