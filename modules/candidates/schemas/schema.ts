import z from "zod";

export type CreateSchema = z.infer<ReturnType<typeof useGetCreateSchema>>;

export const useGetCreateSchema = () => {
  return z.object({
    full_name: z
      .string()
      .trim()
      .nonempty()
      .min(2, { message: "Họ tên ít nhất 2 kí tự" })
      .max(50, { message: "Họ tên tối đa 50 kí tự" }),
    applied_position: z
      .string()
      .trim()
      .nonempty()
      .min(1, { message: "Vị trí ứng tuyển ít nhất 1 kí tự" })
      .max(100, { message: "Vị trí ứng tuyển tối đa 100 kí tự" }),
    status: z.string().trim().nonempty().min(1).max(100),
    resume_url: z.string().optional(),
  });
};
