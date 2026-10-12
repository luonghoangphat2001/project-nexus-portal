import api from './api';

const academicReportService = {
  getOptions: async () => (await api.get('/results/reports/options')).data,
  getReport: async (params) => (await api.get('/results/reports', { params })).data,
  exportReport: async (params) => await api.get('/results/reports.csv', { params, responseType: 'blob' }),
};

export default academicReportService;
