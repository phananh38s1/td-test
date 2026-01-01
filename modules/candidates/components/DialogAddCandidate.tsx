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
  DialogScrollArea,
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
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreateSchema, useGetCreateSchema } from "../schemas/schema";
import FileUploadForm, { SignedUrlData } from "./FileUploadForm";

interface Props extends React.ComponentProps<typeof Dialog> {
  showTrigger?: boolean;
}

const supabase = createClient();

export function DialogAddCandidate({ showTrigger, ...props }: Props) {
  const [isOpenDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [signedUrlData, setSignedUrlData] =
    React.useState<SignedUrlData | null>(null);
  const [isPending, setLoading] = useState(false);

  const form = useForm<CreateSchema>({
    defaultValues: {
      full_name: "",
      applied_position: "",
      status: "",
      resume_url: "",
    },
    resolver: zodResolver(useGetCreateSchema()),
  });

  // const onSubmit = async (values: CreateSchema) => {
  //   if (!signedUrlData) return toast("Ứng viên bắt buộc phải có file CV");

  //   setLoading(true);

  //   if (selectedFile && signedUrlData) {
  //     await fetch(signedUrlData.signedUrl, {
  //       method: "PUT",
  //       body: selectedFile,
  //     });
  //   }

  //   const publicUrl = signedUrlData.signedUrl
  //     ? supabase.storage.from("resumes").getPublicUrl(signedUrlData.name).data
  //         .publicUrl
  //     : null;

  //   const { error } = await supabase
  //     .from("candidates")
  //     .insert([
  //       {
  //         full_name: values.full_name,
  //         applied_position: values.applied_position,
  //         status: values.status,
  //         resume_url: publicUrl,
  //       },
  //     ])
  //     .select()
  //     .single();

  //   setLoading(false);
  //   if (error) return toast("Đã có lỗi xảy ra, thử lại sau");

  //   toast("Thêm mới thành công!");
  //   form.reset();
  //   setOpenDialog(false);
  //   setSelectedFile(null);
  //   setSignedUrlData(null);
  // };

  const onSubmit = async (values: CreateSchema) => {
    if (!signedUrlData) return toast("Ứng viên bắt buộc phải có file CV");

    setLoading(true);

    try {
      if (selectedFile && signedUrlData) {
        const uploadRes = await fetch(signedUrlData.signedUrl, {
          method: "PUT",
          body: selectedFile,
        });
        if (!uploadRes.ok) throw new Error("Upload file thất bại");
      }

      const publicUrl = supabase.storage
        .from("resumes")
        .getPublicUrl(signedUrlData.name).data.publicUrl;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error: funcError } = await supabase.functions.invoke(
        "add-candidate",
        {
          body: {
            full_name: values.full_name,
            applied_position: values.applied_position,
            status: values.status,
            resume_url: publicUrl,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (funcError) throw funcError;

      toast("Thêm mới thành công!");
      form.reset();
      setOpenDialog(false);
      setSelectedFile(null);
      setSignedUrlData(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải dữ liệu";
      console.log("lỗi thêm ứng viên: ", msg);
      toast("Đã có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  console.log("Form Errors:", form.formState.errors);

  return (
    <Dialog
      {...props}
      open={isOpenDialog}
      onOpenChange={() => setOpenDialog(!isOpenDialog)}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="size-5" />
            Thêm ứng viên
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        onPointerDownOutside={(e) => isPending && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Thêm ứng viên</DialogTitle>
          <DialogDescription>Thêm ứng viên để quản lý</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={isPending} className="space-y-4">
              <DialogScrollArea>
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên ứng viên</FormLabel>
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
                      <FormLabel>Vị trí ứng tuyển</FormLabel>
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
                      <FormLabel>Trạng thái ứng viên</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-45">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="interviewing">
                            Interviewing
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FileUploadForm
                  value={selectedFile}
                  onChange={(file) => setSelectedFile(file)}
                  onSignedUrlChange={setSignedUrlData}
                />
              </DialogScrollArea>
            </fieldset>

            <DialogFooter>
              <LoadingButton loading={isPending} type="submit">
                Add
              </LoadingButton>
              <DialogClose asChild>
                <Button disabled={isPending} variant="outline">
                  Huỷ
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
