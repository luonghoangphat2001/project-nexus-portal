import api from './api';

const resultStatisticsService = {
  getFilterOptions: async () => (await api.get('/results/reports/options')).data,
  getStatistics: async (params) => (await api.get('/results/reports', { params })).data,
  exportStatisticsCsv: async (params) => await api.get('/results/reports.csv', { params, responseType: 'blob' }),
};

export default resultStatisticsService;
