import api from './api';

export const academicService = {
  // Faculties
  getAllFaculties: async () => {
    const response = await api.get('/academic/faculties');
    return response.data;
  },

  createFaculty: async (data) => {
    const response = await api.post('/academic/faculties', data);
    return response.data;
  },

  updateFaculty: async (id, data) => {
    const response = await api.put(`/academic/faculties/${id}`, data);
    return response.data;
  },

  deleteFaculty: async (id) => {
    const response = await api.delete(`/academic/faculties/${id}`);
    return response.data;
  },

  // Departments
  getDepartmentsByFaculty: async (facultyId) => {
    if (!facultyId) return [];
    const response = await api.get(`/academic/departments?facultyId=${facultyId}`);
    return response.data;
  },

  getAllDepartments: async () => {
    const response = await api.get('/academic/departments/all');
    return response.data;
  },

  createDepartment: async (data) => {
    const response = await api.post('/academic/departments', data);
    return response.data;
  },

  updateDepartment: async (id, data) => {
    const response = await api.put(`/academic/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`/academic/departments/${id}`);
    return response.data;
  },

  // Majors
  getMajorsByDepartment: async (departmentId) => {
    if (!departmentId) return [];
    const response = await api.get(`/academic/majors?departmentId=${departmentId}`);
    return response.data;
  },

  getAllMajors: async () => {
    const response = await api.get('/academic/majors/all');
    return response.data;
  },

  createMajor: async (data) => {
    const response = await api.post('/academic/majors', data);
    return response.data;
  },

  updateMajor: async (id, data) => {
    const response = await api.put(`/academic/majors/${id}`, data);
    return response.data;
  },

  deleteMajor: async (id) => {
    const response = await api.delete(`/academic/majors/${id}`);
    return response.data;
  },

  // Cohorts
  getAllCohorts: async () => {
    const response = await api.get('/academic/cohorts');
    return response.data;
  },

  createCohort: async (data) => {
    const response = await api.post('/academic/cohorts', data);
    return response.data;
  },

  updateCohort: async (id, data) => {
    const response = await api.put(`/academic/cohorts/${id}`, data);
    return response.data;
  },

  deleteCohort: async (id) => {
    const response = await api.delete(`/academic/cohorts/${id}`);
    return response.data;
  },
};

export default academicService;
