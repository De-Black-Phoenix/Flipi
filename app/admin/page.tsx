"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApproveNGOButton } from "@/components/approve-ngo-button";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { ListSkeleton } from "@/components/skeletons/list-skeleton";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryTab, setPrimaryTab] = useState<"reports" | "users">("reports");
  const [secondaryTab, setSecondaryTab] = useState<"users" | "ngos">("users");
  const [reportStatusFilter, setReportStatusFilter] = useState<"pending" | "reviewed" | "actioned">("pending");
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const hasSetDefaultTab = useRef(false);
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    // Load data immediately when user is available
    const loadData = async () => {
      const [profileResult, usersResult, ngosResult, reportsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("ngos")
          .select(`
            *,
            profiles!ngos_admin_id_fkey (
              full_name,
              email
            )
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("reports")
          .select(
            `
            id,
            reporter_id,
            reported_item_id,
            reported_user_id,
            reason,
            details,
            status,
            created_at,
            reporter:reporter_id (id, full_name, email),
            reported_user:reported_user_id (id, full_name, email),
            reported_item:reported_item_id (id, title)
          `
          )
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const profile = profileResult.data;
      if (!profile || (profile?.role !== "platform_admin" && profile?.user_type !== "platform_admin")) {
        router.replace("/");
        return;
      }

      if (usersResult.data) {
        setUsers(usersResult.data);
      }

      if (ngosResult.data) {
        setNgos(ngosResult.data);
      }

      if (reportsResult.data) {
        setReports(reportsResult.data);
        if (!hasSetDefaultTab.current) {
          const pendingCount = reportsResult.data.filter((report: any) => report.status === "pending").length;
          setPrimaryTab(pendingCount > 0 ? "reports" : "users");
          hasSetDefaultTab.current = true;
        }
      } else if (!hasSetDefaultTab.current) {
        setReports([]);
        setPrimaryTab("users");
        hasSetDefaultTab.current = true;
      }

      setLoading(false);
    };

    loadData();
  }, [user, authLoading, supabase, router]);

  const filteredReports = reports.filter((report) => report.status === reportStatusFilter);

  const formatReportTarget = (report: any) => {
    if (report.reported_item_id && report.reported_item?.title) {
      return `Item: ${report.reported_item.title}`;
    }
    if (report.reported_user_id && report.reported_user?.full_name) {
      return `User: ${report.reported_user.full_name}`;
    }
    if (report.reported_user_id && report.reported_user?.email) {
      return `User: ${report.reported_user.email}`;
    }
    if (report.reported_item_id) return "Item";
    if (report.reported_user_id) return "User";
    return "Unknown target";
  };

  const formatTimestamp = (value?: string) => {
    if (!value) return "Unknown time";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown time";
    return date.toLocaleString();
  };

  const handleReportAction = async (reportId: string, action: "hide" | "warn" | "suspend" | "ignore") => {
    const nextStatus = action === "ignore" ? "reviewed" : "actioned";
    setActionLoadingId(reportId);
    const { error } = await supabase
      .from("reports")
      .update({ status: nextStatus })
      .eq("id", reportId);

    if (error) {
      toast({ title: "Action failed", description: "Please try again." });
      setActionLoadingId(null);
      return;
    }

    setReports((prev) =>
      prev.map((report) => (report.id === reportId ? { ...report, status: nextStatus } : report))
    );
    setOpenReportId(null);
    setActionLoadingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-3 md:pt-8 pb-20 md:pb-12 animate-in fade-in duration-300">
        <div className="mb-4 md:mb-8 hidden md:block">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-lg md:text-4xl font-bold mb-2">Admin Panel</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage users, NGOs, and platform content
              </p>
          </div>
          <Button asChild>
            <Link href="/admin/settings">Platform Settings</Link>
          </Button>
        </div>
      </div>

        <Tabs value={primaryTab} onValueChange={(value) => setPrimaryTab(value as "reports" | "users")} className="space-y-6">
          <TabsList className="bg-muted/30 p-1 rounded-xl">
            <TabsTrigger
              value="reports"
              className="px-4 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="px-4 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Moderation reports</h2>
                <p className="text-sm text-muted-foreground">Review and action community reports.</p>
              </div>
              <Tabs
                value={reportStatusFilter}
                onValueChange={(value) => setReportStatusFilter(value as "pending" | "reviewed" | "actioned")}
              >
                <TabsList className="bg-muted/20 p-1 rounded-lg">
                  <TabsTrigger value="pending" className="px-3 py-1.5 text-xs font-medium">
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="reviewed" className="px-3 py-1.5 text-xs font-medium">
                    Reviewed
                  </TabsTrigger>
                  <TabsTrigger value="actioned" className="px-3 py-1.5 text-xs font-medium">
                    Actioned
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {authLoading || loading ? (
              <ListSkeleton count={6} />
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No reports in this queue.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report: any) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{report.reason}</CardTitle>
                          <CardDescription>{formatReportTarget(report)}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                            {report.status}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setOpenReportId((current) => (current === report.id ? null : report.id))
                            }
                          >
                            {openReportId === report.id ? "Hide details" : "View details"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {openReportId === report.id && (
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium text-foreground">Reported by: </span>
                            {report.reporter?.full_name || report.reporter?.email || report.reporter_id}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Target: </span>
                            {formatReportTarget(report)}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Details: </span>
                            {report.details || "No additional details provided."}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Reported: </span>
                            {formatTimestamp(report.created_at)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, "hide")}
                            disabled={actionLoadingId === report.id}
                          >
                            Hide item
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, "warn")}
                            disabled={actionLoadingId === report.id}
                          >
                            Warn user
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, "suspend")}
                            disabled={actionLoadingId === report.id}
                          >
                            Suspend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReportAction(report.id, "ignore")}
                            disabled={actionLoadingId === report.id}
                          >
                            Ignore
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Tabs value={secondaryTab} onValueChange={(value) => setSecondaryTab(value as "users" | "ngos")}>
              <TabsList className="bg-muted/10 p-1 rounded-lg">
                <TabsTrigger value="users" className="px-3 py-1.5 text-xs font-medium">
                  Users
                </TabsTrigger>
                <TabsTrigger value="ngos" className="px-3 py-1.5 text-xs font-medium">
                  NGOs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                {authLoading || loading ? (
                  <ListSkeleton count={10} />
                ) : !users || users.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">No users found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {users.map((user: any) => (
                      <Card key={user.id}>
                        <CardHeader>
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <div>
                              <CardTitle className="user-name">{user.full_name || "Anonymous"}</CardTitle>
                              <CardDescription>{user.email}</CardDescription>
                            </div>
                            <div className="flex flex-row flex-wrap gap-2 md:items-center">
                              <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 w-fit">
                                {user.user_type}
                              </span>
                              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 w-fit">
                                {user.rank} ({user.points} pts)
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            {user.region && user.town ? `${user.town}, ${user.region}` : "Location not set"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ngos" className="space-y-4">
                {authLoading || loading ? (
                  <ListSkeleton count={5} />
                ) : !ngos || ngos.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">No NGOs registered yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {ngos.map((ngo: any) => (
                      <Card key={ngo.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{ngo.name}</CardTitle>
                              <CardDescription>
                                Admin:{" "}
                                <span className="user-name">{ngo.profiles?.full_name || ngo.profiles?.email}</span>
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                  ngo.status === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : ngo.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {ngo.status}
                              </span>
                              {ngo.status === "pending" && <ApproveNGOButton ngoId={ngo.id} />}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">{ngo.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
