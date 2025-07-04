import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Users, Target } from "lucide-react";

// Test component to verify design tokens and shadcn/ui setup
export function TestDashboard() {
  const metrics = [
    {
      title: "Total Pipeline Value",
      value: "$1.2M",
      change: "+12%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Active Deals",
      value: "47",
      change: "-5%",
      trend: "down" as const,
      icon: Target,
    },
    {
      title: "Team Members",
      value: "23",
      change: "+3%",
      trend: "up" as const,
      icon: Users,
    },
  ];

  const deals = [
    { name: "TechCorp Enterprise", phase: "Phase II", value: "$125,000", status: "critical" as const },
    { name: "StartupXYZ Growth", phase: "Phase III", value: "$75,000", status: "warning" as const },
    { name: "MegaCorp Solution", phase: "Phase I", value: "$200,000", status: "success" as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-pp-success-500";
      case "warning": return "bg-pp-warning-500";
      case "critical": return "bg-pp-danger-500";
      default: return "bg-pp-neutral-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Pipeline Pulse Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Testing design tokens and shadcn/ui components
            </p>
          </div>
          <Button className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Now
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
            
            return (
              <Card key={index} className="pp-metric-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle 
                    className="text-sm font-medium"
                    style={{ 
                      fontSize: "var(--pp-font-size-sm)",
                      fontWeight: "var(--pp-font-weight-medium)",
                      color: "var(--pp-color-neutral-600)"
                    }}
                  >
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-2xl font-bold"
                    style={{ 
                      fontSize: "var(--pp-font-size-2xl)",
                      fontWeight: "var(--pp-font-weight-bold)"
                    }}
                  >
                    {metric.value}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendIcon 
                      className={`h-3 w-3 ${
                        metric.trend === "up" ? "text-pp-success-500" : "text-pp-danger-500"
                      }`} 
                    />
                    <span 
                      className={metric.trend === "up" ? "text-pp-success-500" : "text-pp-danger-500"}
                      style={{ fontSize: "var(--pp-font-size-xs)" }}
                    >
                      {metric.change} from last period
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Progress Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>O2R Phase Progress</CardTitle>
                <CardDescription>
                  Current progress across O2R phases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { phase: "Phase I", progress: 75, deals: 12 },
                  { phase: "Phase II", progress: 60, deals: 8 },
                  { phase: "Phase III", progress: 45, deals: 5 },
                  { phase: "Phase IV", progress: 30, deals: 3 },
                ].map((item) => (
                  <div key={item.phase} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.phase}</span>
                      <span className="text-muted-foreground">{item.deals} deals</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Attention Required Table */}
            <Card>
              <CardHeader>
                <CardTitle>Attention Required</CardTitle>
                <CardDescription>
                  Deals that need immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table className="pp-data-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{deal.name}</TableCell>
                        <TableCell>{deal.phase}</TableCell>
                        <TableCell>{deal.value}</TableCell>
                        <TableCell>
                          <Badge 
                            className={`pp-status-indicator ${getStatusColor(deal.status)} text-white`}
                            style={{
                              borderRadius: "var(--pp-radius-md)",
                              fontSize: "var(--pp-font-size-xs)",
                              fontWeight: "var(--pp-font-weight-medium)"
                            }}
                          >
                            <span className="mr-1">●</span>
                            {deal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Coming Soon</CardTitle>
                <CardDescription>
                  Chart components will be added in the next phase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-[100px]" />
                  <Skeleton className="h-[100px]" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  Export and generate reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button>Export PDF</Button>
                  <Button variant="outline">Export CSV</Button>
                  <Button variant="secondary">Schedule Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Design Token Test */}
        <Card>
          <CardHeader>
            <CardTitle>Design Token Test</CardTitle>
            <CardDescription>
              Verifying Pipeline Pulse design tokens are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                className="p-4 rounded-lg text-center text-white"
                style={{ backgroundColor: "var(--pp-color-primary-500)" }}
              >
                Primary 500
              </div>
              <div 
                className="p-4 rounded-lg text-center text-white"
                style={{ backgroundColor: "var(--pp-color-success-500)" }}
              >
                Success 500
              </div>
              <div 
                className="p-4 rounded-lg text-center text-black"
                style={{ backgroundColor: "var(--pp-color-warning-500)" }}
              >
                Warning 500
              </div>
              <div 
                className="p-4 rounded-lg text-center text-white"
                style={{ backgroundColor: "var(--pp-color-danger-500)" }}
              >
                Danger 500
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Spacing Test</h4>
              <div className="flex items-center gap-4">
                <div 
                  className="bg-primary rounded"
                  style={{ 
                    width: "var(--pp-space-4)", 
                    height: "var(--pp-space-4)" 
                  }}
                ></div>
                <div 
                  className="bg-primary rounded"
                  style={{ 
                    width: "var(--pp-space-8)", 
                    height: "var(--pp-space-8)" 
                  }}
                ></div>
                <div 
                  className="bg-primary rounded"
                  style={{ 
                    width: "var(--pp-space-12)", 
                    height: "var(--pp-space-12)" 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}