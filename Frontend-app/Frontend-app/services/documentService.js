import axios from 'axios';
import { API_BASE_URL } from '../config';

const DOCUMENTS_URL = `${API_BASE_URL}/documents/`;

export const fetchDocuments = async () => {
  const response = await axios.get(DOCUMENTS_URL);
  return response.data;
};

export const createDocument = async (documentData) => {
  const response = await axios.post(DOCUMENTS_URL, documentData);
  return response.data;
};

export const updateDocument = async (id, documentData) => {
  const response = await axios.put(`${DOCUMENTS_URL}${id}/`, documentData);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await axios.delete(`${DOCUMENTS_URL}${id}/`);
  return response.data;
};
