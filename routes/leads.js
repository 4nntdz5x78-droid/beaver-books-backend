const express  = require('express');
const router   = express.Router();
const pool     = require('../database');
const nodemailer = require('nodemailer');

// â”€â”€ ConfiguraÃ§Ã£o do e-mail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // senha de app do Gmail (nÃ£o a senha normal)
  }
});

// â”€â”€ POST /leads  (recebe o formulÃ¡rio) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/', async (req, res) => {
  const {
    nome, email, whatsapp, cidade, objetivo,
    genero, finalizado, paginas, obj_livro,
    prazo, mensagem, arquivo
  } = req.body;

  // ValidaÃ§Ã£o mÃ­nima
  if (!nome || !email) {
    return res.status(400).json({ ok: false, erro: 'Nome e e-mail sÃ£o obrigatÃ³rios.' });
  }

  try {
    // 1 â”€â”€ Salva no banco de dados
    await pool.query(`
      INSERT INTO leads
        (nome, email, whatsapp, cidade, objetivo, genero,
         finalizado, paginas, obj_livro, prazo, mensagem, arquivo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `, [
      nome, email, whatsapp, cidade, objetivo,
      genero || null, finalizado || null,
      paginas ? parseInt(paginas) : null,
      obj_livro || null, prazo || null,
      mensagem || null, arquivo || null
    ]);

    // 2 â”€â”€ Envia e-mail de notificaÃ§Ã£o para a equipe
    const objetivoLabel = {
      publicar:  'ðŸ“– Publicar meu livro',
      orcamento: 'ðŸ’° OrÃ§amento editorial',
      parceria:  'ðŸ¤ Parceria',
      duvidas:   'â“ DÃºvidas gerais',
      imprensa:  'ðŸ“° Imprensa',
      suporte:   'ðŸ›  Suporte'
    }[objetivo] || objetivo;

    await transporter.sendMail({
      from: `"Beaver Books Site" <${process.env.EMAIL_USER}>`,
      to:   process.env.EMAIL_DESTINO,
      subject: `ðŸ“š Novo lead: ${nome} â€” ${objetivoLabel}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#171717;padding:24px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:#c0143c;margin:0;font-size:22px">ðŸ“š Beaver Books</h1>
            <p style="color:#aaa;margin:4px 0 0;font-size:13px">Novo lead recebido pelo site</p>
          </div>

          <div style="background:#fff;border:1px solid #e0dbd4;border-top:none;padding:24px;border-radius:0 0 8px 8px">

            <h2 style="color:#1c1a17;font-size:17px;margin-top:0">ðŸ‘¤ Dados do contato</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr style="background:#f5f2ee">
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold;width:35%">Nome</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${nome}</td>
              </tr>
              <tr>
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">E-mail</td>
                <td style="padding:10px;border:1px solid #e0dbd4">
                  <a href="mailto:${email}" style="color:#c0143c">${email}</a>
                </td>
              </tr>
              <tr style="background:#f5f2ee">
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">WhatsApp</td>
                <td style="padding:10px;border:1px solid #e0dbd4">
                  <a href="https://wa.me/55${(whatsapp||'').replace(/\D/g,'')}" style="color:#c0143c">${whatsapp || 'â€”'}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">Cidade</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${cidade || 'â€”'}</td>
              </tr>
              <tr style="background:#f5f2ee">
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">Objetivo</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${objetivoLabel}</td>
              </tr>
            </table>

            ${genero ? `
            <h2 style="color:#1c1a17;font-size:17px;margin-top:24px">ðŸ“– Sobre o livro</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr style="background:#f5f2ee">
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold;width:35%">GÃªnero</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${genero}</td>
              </tr>
              <tr>
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">Livro finalizado?</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${finalizado || 'â€”'}</td>
              </tr>
              <tr style="background:#f5f2ee">
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">NÂº de pÃ¡ginas</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${paginas || 'â€”'}</td>
              </tr>
              <tr>
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">Objetivo do livro</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${obj_livro || 'â€”'}</td>
              </tr>
              <tr style="background:#f5f2ee">
                <td style="padding:10px;border:1px solid #e0dbd4;font-weight:bold">Prazo desejado</td>
                <td style="padding:10px;border:1px solid #e0dbd4">${prazo || 'â€”'}</td>
              </tr>
            </table>
            ` : ''}

            ${mensagem ? `
            <h2 style="color:#1c1a17;font-size:17px;margin-top:24px">ðŸ’¬ Mensagem</h2>
            <div style="background:#f5f2ee;border:1px solid #e0dbd4;border-radius:6px;padding:14px;font-size:14px;line-height:1.6;color:#555">
              ${mensagem}
            </div>
            ` : ''}

            <div style="margin-top:24px;text-align:center">
              <a href="${process.env.ADMIN_URL || '#'}"
                 style="background:#c0143c;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">
                Ver no Painel Admin â†’
              </a>
            </div>

            <p style="color:#aaa;font-size:11px;text-align:center;margin-top:20px">
              Beaver Books Â© ${new Date().getFullYear()} â€” Este e-mail foi gerado automaticamente pelo site.
            </p>
          </div>
        </div>
      `
    });

    res.json({ ok: true, mensagem: 'Lead salvo com sucesso!' });

  } catch (err) {
    console.error('Erro ao salvar lead:', err.message);
    res.status(500).json({ ok: false, erro: 'Erro interno. Tente novamente.' });
  }
});

module.exports = router;
