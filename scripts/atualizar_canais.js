const fs = require('node:fs');

async function executar() {
    const catalog = JSON.parse(
        fs.readFileSync('./catalog.json', 'utf8')
    );

    const autorizados = new Set(
        (process.env.AUTHORIZED_CHANNEL_IDS || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean)
    );

    let online = 0;
    let offline = 0;
    let ignorados = 0;

    console.log('=== TDM PLAYTV PRO ===');
    console.log('Total:', catalog.liveChannels.length);

    for (const canal of catalog.liveChannels) {
        if (!autorizados.has(canal.id)) {
            ignorados++;
            continue;
        }

        try {
            const resposta = await fetch(canal.streamUrl, {
                signal: AbortSignal.timeout(15000)
            });

            const conteudo = await resposta.text();

            if (resposta.ok && conteudo.trim().startsWith('#EXTM3U')) {
                online++;
                console.log('[ONLINE]', canal.name);
            } else {
                offline++;
                console.log('[FALHA]', canal.name, resposta.status);
            }
        } catch {
            offline++;
            console.log('[ERRO]', canal.name);
        }
    }

    console.log('=== RELATORIO FINAL ===');
    console.log('Online:', online);
    console.log('Falhas:', offline);
    console.log('Ignorados:', ignorados);
}

executar().catch(erro => {
    console.error(erro.message);
    process.exitCode = 1;
});
