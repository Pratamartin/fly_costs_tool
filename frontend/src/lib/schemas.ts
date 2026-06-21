import { z } from "zod";
import { validateCPF, validatePassport } from "./validators";

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("Formato de e-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
  perfil: z.enum(["admin", "coordenador", "aluno"] as const, {
    message: "Selecione um perfil de acesso",
  }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const novaDespesaBaseSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  eventName: z.string().min(1, "O nome do evento é obrigatório"),
  eventLocation: z.string().min(1, "A localização do evento é obrigatória"),
  articleClassification: z.string().min(1, "Selecione a classificação QUALIS do artigo"),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
}).refine(
  (data) => {
    if (data.departureDate && data.returnDate) {
      return new Date(data.returnDate) >= new Date(data.departureDate);
    }
    return true;
  },
  { message: "A data de volta deve ser após a data de ida", path: ["returnDate"] }
);

export const criarProjetoSchema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  code: z.string().min(1, "Sigla do projeto é obrigatória"),
  budget: z
    .string()
    .min(1, "Informe um orçamento válido")
    .refine((v) => {
      const n = parseFloat(v.replace(",", "."));
      return !isNaN(n) && n > 0;
    }, "Informe um orçamento válido"),
});

export const profilePersonalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z
    .string()
    .optional()
    .refine((v) => !v || validateCPF(v), "CPF inválido"),
  rgPassaporte: z
    .string()
    .optional()
    .refine((v) => !v || validatePassport(v), "Passaporte inválido (6-20 caracteres alfanuméricos)"),
  recoveryEmail: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Formato de e-mail inválido"),
});
