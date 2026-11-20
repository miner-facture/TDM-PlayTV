const fs = require('node:fs');

async function executar() {
    const catalog = JSON.parse(
        fs.readFileSync('./catalog.json', 'utf8')
    );

    if (!Array.isArray(catalog.liveChannels)) {
        throw new Error('Catalogo invalido');
    }

    console.log('TDM PlayTV Pro - Atualizador');
    console.log('Total de canais:', catalog.liveChannels.length);

    const autorizados = new Set(
        (process.env.AUTHORIZED_CHANNEL_IDS || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean)
    );

    for (const canal of catalog.liveChannels) {
        if (!autorizados.has(canal.id)) continue;

        try {
            const resposta = await fetch(canal.streamUrl, {
                signal: AbortSignal.timeout(10000)
            });

            const tipo = resposta.headers.get('content-type') || '';

            console.log(canal.name, resposta.status, tipo);

            if (resposta.body) {
                await resposta.body.cancel();
            }
        } catch (erro) {
            console.log(canal.name, 'Falha na verificacao');
        }
    }

    console.log('Verificacao concluida');
}

executar().catch(erro => {
    console.error(erro.message);
    process.exitCode = 1;
});
