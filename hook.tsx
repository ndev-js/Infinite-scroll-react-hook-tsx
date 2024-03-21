import { useState, useEffect, useRef } from "react";
import api from "../Services/index";
interface VideoData {
  id: number;
  title: string;
  imageUrl: string;
  videoUrl: string;
}

const useInfiniteScroll = (apiEndpoint: string, categoryId: number) => {
  const [items, setItems] = useState<VideoData[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const currentPageRef = useRef<number>(1);
  const isFetchingRef = useRef<boolean>(false);
  const lastDivRef = useRef(null);
  const loadMoreItems = async () => {
    if (!hasMore || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      const response = await api.get(
        `${apiEndpoint}?categoryId=${categoryId}&pageNo=${currentPageRef.current}`
      );

      const data = response?.data?.data;

      if (data.success === false && data.response_code === 406) {
        // No more videos left, end pagination
        setHasMore(false);
        return;
      }

      const newData = data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
      }));
      setItems((prevItems) => [...prevItems, ...newData]);

      currentPageRef.current += 1;
    } catch (error: any) {
      if (error.code === 406) {
        setHasMore(false);
        console.log("No more videos are left");
      }
      console.error("something went wrong", error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMoreItems(); // Initial load when component mounts
  }, []);

  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;

    if (scrollHeight - scrollTop <= clientHeight && !isFetchingRef.current) {
      loadMoreItems();
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (lastDivRef.current && hasMore) {
      observer.observe(lastDivRef.current);
    }

    return () => {
      if (lastDivRef.current) {
        observer.disconnect();
      }
    };
  }, [lastDivRef, hasMore, isFetchingRef]);
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return { items, hasMore, isLoading, lastDivRef };
};

export default useInfiniteScroll;
