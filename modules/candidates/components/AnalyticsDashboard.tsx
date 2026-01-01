"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { Candidate } from "@/types/candidates";
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  CircleDot,
  Clock,
  ExternalLink,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export type AnalyticsData = {
  total_candidates: number;
  status_ratio: Record<string, number>;
  top_positions: { pos_name: string; candidate_count: number }[] | null;
  recent_candidates: Candidate[];
};

export default function AnalyticsDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return setLoading(false);
      try {
        const { data: resData, error: resError } =
          await supabase.functions.invoke("analytics");
        if (resError) throw resError;
        setData(resData);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Không thể tải dữ liệu";
        setError(msg);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [supabase]);

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">Đang tải phân tích...</div>
    );
  if (error)
    return <div className="p-8 text-red-500 text-center">Lỗi: {error}</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">
        Tổng quan Tuyển dụng
      </h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng ứng viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total_candidates}</div>
            <p className="text-xs text-muted-foreground">
              Ứng viên đã nộp hồ sơ
            </p>
          </CardContent>
        </Card>

        {Object.entries(data?.status_ratio || {}).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                Trạng thái: {status}
              </CardTitle>
              {status === "new" ? (
                <CircleDot className="h-4 w-4 text-blue-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">Phân bổ hồ sơ</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Ứng viên mới nhất trong 7 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recent_candidates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.applied_position}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "new" ? "secondary" : "default"}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={c.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        CV <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Top Vị trí
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.top_positions ? (
              <div className="space-y-4">
                {data.top_positions.map((p, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      {p.pos_name}
                    </div>
                    <Badge variant="outline">{p.candidate_count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Chưa có dữ liệu vị trí nổi bật
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
