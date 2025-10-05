import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AiChat } from "@/components/dashboard/ai-chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AiAssistantPage() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <AiChat />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Features</CardTitle>
              <CardDescription>How our AI can help you trade smarter</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Get real-time market analysis and insights</li>
                <li>• Receive personalized stock recommendations</li>
                <li>• Analyze your portfolio performance</li>
                <li>• Learn about trading strategies and concepts</li>
                <li>• Stay updated on market news and events</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggested Questions</CardTitle>
              <CardDescription>Try asking the AI about these topics</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• "What stocks should I consider for long-term growth?"</li>
                <li>• "Explain the current market trends in tech stocks"</li>
                <li>• "How would a rate cut affect my portfolio?"</li>
                <li>• "What's your analysis of AAPL's recent performance?"</li>
                <li>• "Help me understand options trading strategies"</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
