import React, { useEffect, useState } from 'react';
import './CryptoNews.css';

const CryptoNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          `https://newsdata.io/api/1/news?apikey=pub_8044952b8ed799f52d010671ae8fd64f6464e&category=technology&language=en`
        );
        const data = await response.json();
        console.log("News API response:", data); // <-- log entire object
  
        if (Array.isArray(data.results)) {
          setNews(data.results);
        } else {
          setNews([]);
        }
      } catch (error) {
        console.error('Failed to fetch crypto news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchNews();
  }, []);
  

  return (
    <div className="crypto-news">
      <h2>Latest Crypto News</h2>
      {loading ? (
        <p>Loading crypto news...</p>
      ) : news.length === 0 ? (
        <p>No news available at the moment.</p>
      ) : (
        <ul>
          {news.slice(0, 5).map((article, index) => (
            <li key={index}>
              <a href={article.link} target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
              <p>{article.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CryptoNews;
