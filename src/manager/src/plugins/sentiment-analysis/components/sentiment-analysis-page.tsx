"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SentimentResult {
  sentiment: "Positive" | "Negative";
  confidence: number;
}

export function SentimentAnalysisPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<SentimentResult | null>(null)

  const handleAnalyze = async () => {
    // Simula uma chamada de API
    const mockApiCall = new Promise((resolve) =>
      setTimeout(() => {
        resolve({
          sentiment: Math.random() > 0.5 ? "Positive" : "Negative",
          confidence: Math.random(),
        })
      }, 1000)
    )

    const analysisResult = await mockApiCall
    setResult(analysisResult)
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze..."
            className="mb-4"
          />
          <Button onClick={handleAnalyze}>Analyze</Button>
        </CardContent>
      </Card>
      {result && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Sentiment: {result.sentiment}</p>
            <p>Confidence: {result.confidence.toFixed(2)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
