const BASE_URL = 'https://newsapi.org/v2/everything';
const API_KEY = process.env.NEWSAPI_API_KEY;

const getISODate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getNewsURL = (query) => {
  `${BASE_URL}?q=${query}&from=${getISODate()}&apiKey=${API_KEY}`;
};

class News {
  constructor(query) {
    this.query = query;
    this.url = getNewsURL(query);
    this.size = 0;
  }
}
