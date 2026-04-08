import { z } from 'zod';

export const flowNodeSchema = z.object({
  id: z.number(),
  label: z.string(),
  position: z.tuple([z.number(), z.number()]),
  delay: z.number(),
  icon: z.string(),
  isCenter: z.boolean().optional(),
});

export const flowConnectorSchema = z.object({
  from: z.number(),
  to: z.number(),
  delay: z.number(),
});

export const flowDataSchema = z.object({
  nodes: z.array(flowNodeSchema),
  connectors: z.array(flowConnectorSchema),
});

export const defaultFlowData = {
  nodes: [
    { id: 1, label: "Cliente", position: [420, 1080] as [number, number], delay: 15, icon: "user" },
    { id: 2, label: "Escolha\ndos produtos", position: [1120, 1080] as [number, number], delay: 45, icon: "cart" },
    { id: 3, label: "Sistema de\npagamento", position: [1920, 1080] as [number, number], delay: 75, icon: "system", isCenter: true },
    { id: 4, label: "API de\npagamento\n(online)", position: [1920, 380] as [number, number], delay: 95, icon: "api" },
    { id: 5, label: "Cobrar Agora\n(presencial)", position: [1920, 1780] as [number, number], delay: 125, icon: "pos" },
    { id: 6, label: "Confirmação\ndo pagamento", position: [2720, 1080] as [number, number], delay: 170, icon: "check" },
    { id: 7, label: "Recebimento\nem até 30 dias", position: [3420, 1080] as [number, number], delay: 200, icon: "money" }
  ],
  connectors: [
    { from: 1, to: 2, delay: 30 },
    { from: 2, to: 3, delay: 60 },
    { from: 4, to: 3, delay: 110 },
    { from: 5, to: 3, delay: 140 },
    { from: 3, to: 6, delay: 155 },
    { from: 6, to: 7, delay: 185 }
  ]
};
