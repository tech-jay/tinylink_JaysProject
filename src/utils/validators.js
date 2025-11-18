const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function isValidUrl(u) {
  try {
    new URL(u);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { CODE_REGEX, isValidUrl };
