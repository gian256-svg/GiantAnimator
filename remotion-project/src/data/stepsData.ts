import { z } from 'zod';

export const stepNodeSchema = z.object({
  id: z.number(),
  text: z.string(),
  position: z.tuple([z.number(), z.number()]),
  delay: z.number(),
  icon: z.string().optional(),
});

export const stepsDataSchema = z.object({
  nodes: z.array(stepNodeSchema),
});

export const defaultStepsData = {
  nodes: [
    { id: 1, text: "Fornecedor é\ncadastrado no Portal", position: [480, 650] as [number, number], delay: 20, icon: "supplier" },
    { id: 2, text: "Fornecedor realiza\nadesão ao programa", position: [1150, 1080] as [number, number], delay: 110, icon: "supplier" },
    { id: 3, text: "Fornecedor cadastra\nseu contrato", position: [1800, 650] as [number, number], delay: 200, icon: "supplier" },
    { id: 4, text: "Comprador valida\no contrato", position: [2480, 1180] as [number, number], delay: 290, icon: "buyer" },
    { id: 5, text: "Fornecedor solicita propostas\nde financiamento", position: [3170, 650] as [number, number], delay: 380, icon: "supplier" },
    { id: 6, text: "Bancos enviam\npropostas", position: [3450, 1380] as [number, number], delay: 470, icon: "bank" },
    { id: 7, text: "Fornecedor escolhe\nproposta + trava bancária", position: [2880, 1720] as [number, number], delay: 560, icon: "supplier" },
    { id: 8, text: "Bancos e Compradores\nconfirmam", position: [1920, 1720] as [number, number], delay: 650, icon: "bank_buyer" },
    { id: 9, text: "Banco libera\nfinanciamento", position: [960, 1720] as [number, number], delay: 740, icon: "bank" }
  ]
};
