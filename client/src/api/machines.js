import axios from 'axios';

export const getMyMachines = async (token) => {
  const res = await axios.get('http://localhost:5050/api/machines', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};

export const createMachine = async (data, token) => {
  return axios.post('http://localhost:5050/api/machines', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
