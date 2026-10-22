// Role helper utilities for George Steuart Intranet
// Supported roles: 'superadmin', 'groupadmin', 'subadmin', 'employee'
// Backward compatible with: 'super_admin', 'group_admin', 'sub_admin'

const isSuperAdmin = (role) => {
    return role === 'superadmin' || role === 'super_admin';
};

const isGroupAdmin = (role) => {
    return role === 'groupadmin' || role === 'group_admin';
};

const isSuperOrGroupAdmin = (role) => {
    return isSuperAdmin(role) || isGroupAdmin(role);
};

const isSubAdmin = (role) => {
    return role === 'subadmin' || role === 'sub_admin';
};

const isAnyAdmin = (role) => {
    return isSuperOrGroupAdmin(role) || isSubAdmin(role);
};

const normalizeRole = (role) => {
    if (!role) return 'employee';
    const r = role.toLowerCase().trim();
    if (r === 'super_admin' || r === 'superadmin') return 'superadmin';
    if (r === 'group_admin' || r === 'groupadmin') return 'groupadmin';
    if (r === 'sub_admin' || r === 'subadmin') return 'subadmin';
    return 'employee';
};

module.exports = {
    isSuperAdmin,
    isGroupAdmin,
    isSuperOrGroupAdmin,
    isSubAdmin,
    isAnyAdmin,
    normalizeRole
};
