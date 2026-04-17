const enums = require('./enums');

function hasRole(user, role) {
  return Array.isArray(user?.roles) && user.roles.includes(role);
}

function canRevealContact(serviceRequestStatus) {
  return ['ACCEPTED', 'COMPLETED'].includes(serviceRequestStatus);
}

module.exports = {
  ...enums,
  hasRole,
  canRevealContact,
};
