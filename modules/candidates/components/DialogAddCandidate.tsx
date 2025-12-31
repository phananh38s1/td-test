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

  const onSubmit = async (values: CreateSchema) => {
    if (!signedUrlData) return toast("Ứng viên bắt buộc phải có file CV");

    setLoading(true);

    if (selectedFile && signedUrlData) {
      await fetch(signedUrlData.signedUrl, {
        method: "PUT",
        body: selectedFile,
      });
    }

    const publicUrl = signedUrlData.signedUrl
      ? supabase.storage.from("resumes").getPublicUrl(signedUrlData.name).data
          .publicUrl
      : null;

    const { error } = await supabase
      .from("candidates")
      .insert([
        {
          full_name: values.full_name,
          applied_position: values.applied_position,
          status: values.status,
          resume_url: publicUrl,
        },
      ])
      .select()
      .single();

    setLoading(false);
    if (error) return toast("Đã có lỗi xảy ra, thử lại sau");

    toast("Thêm mới thành công!");
    form.reset();
    setOpenDialog(false);
    setSelectedFile(null);
    setSignedUrlData(null);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm ứng viên</DialogTitle>
          <DialogDescription>Thêm ứng viên để quản lý</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

            <DialogFooter>
              <LoadingButton loading={isPending} type="submit">
                Add
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
