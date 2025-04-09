import { useState } from "react";
import Chatbot from "./components/chatbot";
import "./App.css";

function App() {
  const [projects] = useState([
    {
      id: 1,
      name: "E-commerce Platform Upgrade",
      status: "In Progress",
      riskScore: "Medium",
      issues: [
        "Backend team resource shortage",
        "Payment gateway integration delayed by 2 weeks",
      ],
      budgetUtilization: 65,
    },
    {
      id: 2,
      name: "CRM System Migration",
      status: "Planning",
      riskScore: "Low",
      issues: ["Vendor contract negotiations pending"],
      budgetUtilization: 15,
    },
    {
      id: 3,
      name: "AI Customer Support Chatbot",
      status: "Testing",
      riskScore: "High",
      issues: [
        "Accuracy below target (82% vs 90% goal)",
        "Client requesting additional features",
      ],
      budgetUtilization: 90,
    },
  ]);

  return <Chatbot projects={projects} />;
}

export default App;
