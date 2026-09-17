import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
}

const useSEO = ({ title, description }: SEOProps) => {
  useEffect(() => {
    document.title = title;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);
  }, [title, description]);
};

export default useSEO;