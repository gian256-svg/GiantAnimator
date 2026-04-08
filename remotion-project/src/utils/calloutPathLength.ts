/**
 * Calcula o comprimento total de um callout de 3 pontos
 * (lineStart → lineElbow → lineEnd) para usar no dash animation.
 */
export const getCalloutPathLength = (
  lineStart: { x: number; y: number },
  lineElbow:  { x: number; y: number },
  lineEnd:    { x: number; y: number },
): number => {
  const seg1 = Math.hypot(lineElbow.x - lineStart.x, lineElbow.y - lineStart.y);
  const seg2 = Math.hypot(lineEnd.x   - lineElbow.x, lineEnd.y   - lineElbow.y);
  return seg1 + seg2;
};

/**
 * Retorna strokeDasharray e strokeDashoffset para o progresso 0→1
 */
export const getCalloutDash = (
  totalLength: number,
  progress: number,
): { strokeDasharray: string; strokeDashoffset: number } => ({
  strokeDasharray:  `${totalLength}`,
  strokeDashoffset: totalLength * (1 - progress),
});
