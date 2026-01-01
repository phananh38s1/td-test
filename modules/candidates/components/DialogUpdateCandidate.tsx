"use client";

import { LoadingButton } from "@/components/buttons/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreateSchema, useGetCreateSchema } from "../schemas/schema";

export const dynamic = "force-dynamic";

interface Props {
  candidate: {
    id: number;
    full_name: string;
    applied_position: string;
    status: string;
    resume_url: string;
  };
}

export function DialogUpdateCandidate({ candidate }: Props) {
  const supabase = createClient();
  const [isOpen, setOpen] = useState(false);
  const [isPending, setLoading] = useState(false);

  const form = useForm<CreateSchema>({
    defaultValues: {
      full_name: candidate.full_name,
      applied_position: candidate.applied_position,
      status: candidate.status,
      resume_url: candidate.resume_url,
    },
    resolver: zodResolver(useGetCreateSchema()),
  });

  const onSubmit = async (values: CreateSchema) => {
    setLoading(true);

    const { error } = await supabase
      .from("candidates")
      .update({
        full_name: values.full_name,
        applied_position: values.applied_position,
        status: values.status,
      })
      .eq("id", candidate.id);

    setLoading(false);

    if (error) {
      toast("Cập nhật thất bại");
      return;
    }

    toast("Cập nhật thành công");
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Update</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật ứng viên</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin (CV giữ nguyên)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col gap-5"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ tên</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applied_position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vị trí</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="interviewing">Interviewing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resume_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CV (đang sử dụng)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>

                  {field.value && (
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline mt-1 inline-block"
                    >
                      Link CV
                    </a>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <LoadingButton loading={isPending} type="submit">
                Update
              </LoadingButton>
              <DialogClose asChild>
                <Button variant="outline">Huỷ</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
