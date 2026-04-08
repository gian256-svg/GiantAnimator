import { z } from 'zod';

export const fidcNodeSchema = z.object({
  id: z.number(),
  label: z.string(),
  position: z.tuple([z.number(), z.number()]),
  delay: z.number(),
  icon: z.string(),
  isCenter: z.boolean().optional(),
});

export const fidcArrowSchema = z.object({
  id: z.string(),
  from: z.tuple([z.number(), z.number()]),
  to: z.tuple([z.number(), z.number()]),
  delay: z.number(),
  label: z.string().optional(),
  labelPosition: z.enum(['top', 'bottom', 'left', 'right']).optional(),
  direction: z.enum(['right', 'left', 'up', 'down', 'path']),
});

export const fidcFlowDataSchema = z.object({
  nodes: z.array(fidcNodeSchema),
  arrows: z.array(fidcArrowSchema),
});

export const defaultFidcFlowData = {
  nodes: [
    { id: 1, label: "Produto ou\nServiço", position: [400, 1150] as [number, number], delay: 10, icon: "box" },
    { id: 2, label: "Cliente/Sacado\n(Devedor)", position: [900, 1650] as [number, number], delay: 30, icon: "users" },
    { id: 3, label: "Empresa/Originador\n(Cedente)", position: [900, 600] as [number, number], delay: 50, icon: "store" },
    { id: 4, label: "Pagamento a\nprazo\n(Recebíveis)", position: [1450, 1150] as [number, number], delay: 70, icon: "card" },
    { id: 5, label: "FIDC", position: [3200, 600] as [number, number], delay: 110, icon: "folder", isCenter: true }
  ],
  arrows: [
    { id: 'arr1', from: [820, 800] as [number, number], to: [820, 1350] as [number, number], delay: 90, direction: 'down' as const },
    { id: 'arr2', from: [980, 1350] as [number, number], to: [980, 800] as [number, number], delay: 100, direction: 'up' as const },
    { id: 'arr3', from: [1300, 750] as [number, number], to: [2800, 750] as [number, number], delay: 130, direction: 'right' as const, label: "Venda de recebíveis\n(Direitos creditórios)", labelPosition: 'bottom' as const },
    { id: 'arr4', from: [2800, 500] as [number, number], to: [1300, 500] as [number, number], delay: 160, direction: 'left' as const, label: "Antecipa recebimento a\numa taxa de desconto", labelPosition: 'top' as const },
    { id: 'arr5', from: [1200, 1650] as [number, number], to: [3200, 900] as [number, number], delay: 190, direction: 'path' as const, label: "Devedor paga as parcelas\n(Após cedidos os recebíveis, o FIDC\ntem direito ao recebimento)", labelPosition: 'bottom' as const }
  ]
};
