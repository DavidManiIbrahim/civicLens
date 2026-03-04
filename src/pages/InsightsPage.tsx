import Layout from "@/components/Layout";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

const executiveSummary = `The Clean Air Amendment Act hearing revealed strong public support for cleaner air goals (52% positive sentiment) but significant concerns about implementation timeline and economic impact on small businesses. Key stakeholders agree on the need for emissions reduction but diverge on the pace of transition. AI analysis suggests extending the timeline from 5 to 8 years and strengthening the small business tax credit program would increase public approval by an estimated 15%.`;

const keyArguments = {
  forBill: [
    "$4.2B annual savings in healthcare costs",
    "23% reduction in particulate matter within 5 years",
    "Tax incentives for small business compliance",
    "Phased implementation reduces economic shock",
  ],
  againstBill: [
    "5-year timeline is unrealistic for manufacturers",
    "Compliance costs may force small plant closures",
    "Rural communities disproportionately affected",
    "Insufficient transition funding in current draft",
  ],
};

const riskIndicators = [
  { topic: "Job displacement", risk: "high", detail: "65% negative sentiment on employment impact" },
  { topic: "Timeline feasibility", risk: "high", detail: "72% believe 5-year timeline is too aggressive" },
  { topic: "Small business burden", risk: "medium", detail: "Mixed sentiment - tax credits help but may not be enough" },
  { topic: "Public health framing", risk: "low", detail: "85% positive sentiment on health benefits" },
];

const riskColors = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
};

export default function InsightsPage() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Legislative Insights</h1>
            <p className="mt-1 text-muted-foreground">
              AI-generated briefing for policymakers.
            </p>
          </div>
        </div>

        {/* Placeholder Summary */}
        <div className="mb-8 rounded-xl border border-border bg-card p-12 shadow-card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">AI Insights Pipeline</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            Our AI engine is currently collecting data from live hearings and citizen participation.
            Deep legislative insights and risk monitoring will appear here as more sessions are processed.
          </p>
        </div>
      </div>
    </Layout>
  );
}
