import api from './api';

export const roleService = {
  getAllRoles: () => {
    return api.get('/roles');
  },
};
