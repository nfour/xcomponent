import fetchMock from 'fetch-mock';
import usersJson from './users.json';
import meJson from './me.json';

export const MOCKED_API_URL = 'http://myapi.com';

fetchMock.get(`${MOCKED_API_URL}/api/users`, { status: 200, body: usersJson });
fetchMock.get(`${MOCKED_API_URL}/api/me`, { status: 200, body: meJson });
