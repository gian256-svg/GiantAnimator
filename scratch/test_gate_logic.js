
// Simulação da lógica de Gate de 95%
const lastAudit = {
    score: 95,
    isApproved: true,
    critique: "Aviso: Servidor de auditoria indisponível (Erro 503). O vídeo foi gerado com base nos dados extraídos, mas a fidelidade visual não pôde ser validada pela IA Auditora. Verifique manualmente."
};

function verifyFidelity(audit) {
    console.log(`[TESTE] Verificando Score: ${audit.score}%`);
    if (audit && audit.score < 95) {
        throw new Error(`FIDELIDADE INSUFICIENTE: O render atingiu apenas ${audit.score}% de precisão. Meta mínima: 95%. Auditor: ${audit.critique}`);
    }
    console.log("✅ [TESTE] Gate de 95% Aprovado!");
}

try {
    verifyFidelity(lastAudit);
} catch (e) {
    console.error("❌ [TESTE] Falha no Gate:", e.message);
}

// Teste com falha (85)
const failAudit = { score: 85, critique: "Erro 503" };
try {
    verifyFidelity(failAudit);
} catch (e) {
    console.log("✅ [TESTE] Sucesso: O sistema barrou corretamente o score de 85%");
}
