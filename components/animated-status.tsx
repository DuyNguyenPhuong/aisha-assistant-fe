import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
const AnimatedStatus: React.FC = () => {
  const { t } = useTranslation();
  const texts = [t("thinking"), t("craftingResponse"), t("almostThere")];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [texts.length]);
  return <span className="animated-status">{texts[index]}</span>;
};
export default AnimatedStatus;
