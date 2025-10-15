import type { DashboardPlugin } from "../plugin";
import { FaSmile } from "react-icons/fa";
import { SentimentAnalysisPage } from "./components/sentiment-analysis-page";

const sentimentAnalysisPlugin: DashboardPlugin = {
  name: "Sentiment Analysis",
  icon: FaSmile,
  component: SentimentAnalysisPage,
};

export default sentimentAnalysisPlugin;
