import React, { useCallback, useEffect, useState } from "react";
import "./movie-grid.scss";
import { useHistory, useParams } from "react-router";
import MovieCard from "./../movie-card/MovieCard";
import tmdbApi, { category, movieType, tvType } from "../../api/tmdbApi";
import Button, { OutlineButton } from "../button/Button";
import Input from "../input/Input";
import * as Config from "./../../constants/Config";

const MovieGrid = (props) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const { keyword } = useParams();

  useEffect(() => {
    const getList = async () => {
      let response = null;

      // لو مفيش كلمة بحث، اعرض الأفلام العادية (الرائجة/الجديدة)
      // If there is no search keyword, show normal movies (popular/upcoming)
      if (keyword === undefined) {
        const params = {};
        switch (props.category) {
          case category.movie:
            response = await tmdbApi.getMoviesList(movieType.upcoming, { params });
            break;
          default:
            response = await tmdbApi.getTvList(tvType.popular, { params });
        }
        setItems(response.results);
        setTotalPage(response.total_pages);
      } 
      else {
        // --- 🚀 التعديل الجديد للذكاء الاصطناعي (New AI Modification) 🚀 ---
        try {
          // 1. نرسل الجملة لسيرفر الـ AI بتاعنا
          // 1. Send the sentence to our AI server
          console.log("Sending query to AI Backend:", keyword);
          const aiResponse = await fetch("http://localhost:8000/api/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: keyword })
          });
          
          const aiData = await aiResponse.json();
          console.log("AI Response received:", aiData);

          // 2. نجمع أرقام الأفلام اللي الـ AI اختارها (البطل + البدائل)
          // 2. Collect the IDs of the movies chosen by AI (Hero + Alternatives)
          const movieIds = [aiData.hero.id, ...aiData.alternatives.map(alt => alt.id)];

          // 3. نجيب تفاصيل الأفلام دي من TMDB عشان نقدر نعرض صورها وأسمائها
          // 3. Fetch the details of these movies from TMDB so we can show their posters and names
          const moviesData = await Promise.all(
            movieIds.map(id => tmdbApi.detail(props.category, id, { params: {} }))
          );

          // 4. نعرض الأفلام على الشاشة
          // 4. Display the movies on the screen
          setItems(moviesData);
          setTotalPage(1); // مفيش صفحات تانية في الـ AI حالياً / No pagination for AI right now

        } catch (error) {
          console.error("Error fetching from AI Backend:", error);
        }
      }
    };
    getList();
  }, [keyword, props.category]);

  const loadMore = async () => {
    // تركنا هذا الكود كما هو للأفلام العادية
    // We left this code as is for normal movies
    let response = null;
    if (keyword === undefined) {
      const params = { page: page + 1 };
      switch (props.category) {
        case category.movie:
          response = await tmdbApi.getMoviesList(movieType.upcoming, { params });
          break;
        default:
          response = await tmdbApi.getTvList(tvType.popular, { params });
      }
      setItems([...items, ...response.results]);
      setPage(page + 1);
    }
  };

  return (
    <>
      <div className="section mb-3">
        <MovieSearch category={props.category} keyword={keyword} />
      </div>
      <div className="movie-grid">
        {items.map((item, index) => (
          <MovieCard key={index} category={props.category} item={item} />
        ))}
      </div>
      {page < totalPage ? (
        <div className="movie-grid__loadmore">
          <OutlineButton className="small" onClick={loadMore}>
            Load more
          </OutlineButton>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

const MovieSearch = (props) => {
  const history = useHistory();
  const [keyword, setKeyword] = useState(props.keyword ? props.keyword : "");

  const goToSearch = useCallback(() => {
    if (keyword.trim().length > 0) {
      history.push(`/${Config.HOME_PAGE}/${category[props.category]}/search/${keyword}`);
    }
  }, [keyword, props.category, history]);

  useEffect(() => {
    const enterEvent = (e) => {
      e.preventDefault();
      if (e.keyCode === 13) {
        goToSearch();
      }
    };
    document.addEventListener("keyup", enterEvent);
    return () => {
      document.removeEventListener("keyup", enterEvent);
    };
  }, [goToSearch]);

  return (
    <div className="movie-search">
      <Input
        type="text"
        placeholder="صف فيلمك المفضل، حالتك المزاجية، أو قصة تبحث عنها..." 
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <Button className="small" onClick={goToSearch}>
        Search AI
      </Button>
    </div>
  );
};

export default MovieGrid;