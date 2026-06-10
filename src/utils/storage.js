const KEYS = {
  HEADER_IMAGE: 'menu_tool_header_img',
  BG_IMAGE: 'menu_tool_bg_img',
  FOOTER_IMAGE: 'menu_tool_footer_img',
  JSON_DATA: 'menu_tool_json_data',
};

export function saveToLocal(key, data) {
  try {
    localStorage.setItem(key, data);
    return true;
  } catch (e) {
    // localStorage full — warn but don't crash
    console.warn('localStorage write failed:', e.message);
    return false;
  }
}

export function loadFromLocal(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function removeFromLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}

export function cleanupImages() {
  // Attempt to save space by removing large image keys
  removeFromLocal(KEYS.HEADER_IMAGE);
  removeFromLocal(KEYS.BG_IMAGE);
  removeFromLocal(KEYS.FOOTER_IMAGE);
}

export { KEYS };
