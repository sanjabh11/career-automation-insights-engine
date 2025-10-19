import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Resource {
  title: string;
  url: string;
  description: string;
}

export default function LearningResourceService() {
  const [resources, setResources] = useState<Resource[]>([
    { title: "AI for Everyone (Coursera)", url: "https://www.coursera.org/learn/ai-for-everyone", description: "Non-technical introduction to AI for all professionals." },
    { title: "Google Machine Learning Crash Course", url: "https://developers.google.com/machine-learning/crash-course", description: "Hands-on introduction to ML concepts and TensorFlow." },
    { title: "Khan Academy: Data Science", url: "https://www.khanacademy.org/computing/computer-science", description: "Free data science and CS basics." },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Card className="max-w-3xl mx-auto shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">Learning Resource Fetch Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {resources.map((res, idx) => (
              <li key={idx} className="p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-700 hover:underline">{res.title}</a>
                  <p className="text-sm text-gray-600 mt-1">{res.description}</p>
                </div>
                <Button asChild variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50 mt-2 md:mt-0">
                  <a href={res.url} target="_blank" rel="noopener noreferrer">Visit</a>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
